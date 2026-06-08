---
name: git-repo-compact
description: Compact and shrink Git repositories by diagnosing object storage, running safe Git maintenance, and planning or executing large-blob history rewrites with git-filter-repo. Use when a user asks to reduce .git size, remove big blobs, clean repository history, garbage collect a repo, purge large committed files, migrate large files to LFS, recover space after a rewrite, prune a git repo, shrink disk usage of a repo, or make the repository take less space on disk.
metadata:
  short-description: Shrink Git repositories safely
---

# Git Repository Compaction

Use this skill to reduce repository size without losing useful history or surprising collaborators. Treat history rewriting as destructive: inspect first, back up or use a fresh clone, explain impact, and get explicit user confirmation before force-pushing or deleting original refs.

There are two distinct modes. Always try **Light Mode** first — it is non-destructive and often resolves the user's complaint (stale branches, dangling worktrees, loose objects) without ever touching commit SHAs. Only escalate to **Hard Mode** when the diagnosis shows large blobs reachable from history, since that is the only case ordinary maintenance cannot fix.

## Light Mode — housekeeping (no SHA changes, safe to run freely)

Targets: unused local/remote branches, stale worktrees, loose/unreachable objects, stale remote-tracking refs. None of this rewrites history, so it needs no force-push and no collaborator coordination.

1. Survey state:
   ```sh
   git branch -a -v
   git worktree list
   git status --short
   du -sh .git && git count-objects -vH
   ```
2. Find safe-to-delete branches: `git branch --merged main` (merged → safe) vs `--no-merged` (has unmerged work → confirm before deleting). Cross-check with `gh pr list --state all --head <branch>` — a branch tied only to **MERGED** PRs with no open PRs depending on it is safe to delete both locally (`git branch -D`) and on the remote (`git push origin --delete <branch>`).
3. Prune stale remote-tracking refs and dangling worktrees:
   ```sh
   git remote prune origin
   git worktree prune
   ```
4. Reclaim loose/unreachable object space:
   ```sh
   git gc
   # or, only when no other Git process is writing to the repo:
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   ```
5. **Check for non-standard local refs** that silently keep old history alive — these are easy to miss and were the actual cause of ~760MB staying resident in one real cleanup even after all branches/worktrees were pruned:
   ```sh
   git for-each-ref   # look for refs outside refs/heads, refs/tags, refs/remotes
   ```
   Tooling (e.g. Codex CLI) can leave refs like `refs/codex/snapshots/<id>` pointing at old worktree-snapshot commits. If they reference superseded history and the user confirms they're disposable backups, delete with `git update-ref -d <ref>` then re-run step 4. Also watch for stray files like `.git/refs/.DS_Store` (Finder artifacts) that make `git fsck` complain — harmless, but mention them; only remove if the user wants to.
   - Re-run `du -sh .git` after each deletion+gc pass to confirm space is actually reclaimed — the number won't move until the *last* keep-alive ref is gone.

If `du -sh .git` is still large after Light Mode and `git rev-list --objects --all | git cat-file --batch-check ...` (see Diagnose below) shows big blobs reachable from history, escalate to Hard Mode.

## Hard Mode — history rewrite (destroys & recreates SHAs, force-push required)

Targets: large blobs baked into reachable history (e.g. repeatedly re-recorded snapshot-test images, committed binaries, accidentally-committed datasets/secrets) that ordinary `git gc` cannot remove because they're still reachable.

1. Identify the repository and current state.
   - Run `git rev-parse --show-toplevel`, `git status --short`, `du -sh .git`, and `git count-objects -vH`.
   - If it is not a Git repo, stop and report that.
   - If the worktree is dirty, do not rewrite history until the user commits, stashes, or approves a disposable clone.

2. Diagnose what is taking space.
   - Prefer `git filter-repo --analyze` when available; inspect `filter-repo/analysis/*-{all,deleted}-sizes.txt`.
   - Use `git-sizer` when installed for shape problems such as many refs, huge trees, or excessive paths.
   - For a quick local-only object view, use:

   ```sh
   git rev-list --objects --all |
     git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' |
     awk '$1 == "blob" {print $3 "\t" $2 "\t" substr($0, index($0,$4))}' |
     sort -nr |
     head -50
   ```
   - Aggregate by path/directory to see whether the bloat is one-off large files (good candidates for `--strip-blobs-bigger-than`) or a *churned path* — many historical versions of the same file(s), e.g. re-recorded screenshots or generated reports (better candidates for `--path ... --invert-paths` + re-adding the current version fresh, since a size threshold would also catch unrelated legitimate large files like audio/video assets).

3. Choose the rewrite strategy — get explicit user sign-off on which one before touching anything:
   - **Path-based removal + re-add** (preferred for churned, regenerable artifacts like snapshot-test images): strips every historical version of a path from all history, then the current version is re-committed fresh on top in the rewritten clone — net effect is zero working-tree change, history just stops carrying the old copies.

   ```sh
   git filter-repo --path path/to/dir --invert-paths --force
   # then in the resulting clone: copy back the current files and commit them as one new commit
   ```

   - **Size-based stripping** (preferred for one-off oversized blobs, e.g. an accidentally committed video or DB dump): only safe when you've confirmed no legitimate files sit near the threshold.

   ```sh
   git filter-repo --strip-blobs-bigger-than 100M
   ```

   - If removing secrets or sensitive files, use the host-specific sensitive-data process and rotate credentials. Do not present repository compaction as sufficient secret remediation.

4. Work in a disposable mirror clone, never the user's only working copy:
   ```sh
   git clone --mirror <original-path-or-url> <repo>-mirror-rewrite
   cd <repo>-mirror-rewrite && git filter-repo ...
   ```
   Then clone *from the rewritten mirror* into a normal working clone to verify and (if doing path-based removal) re-add current files:
   ```sh
   git clone <repo>-mirror-rewrite <repo>-rewritten
   ```
   `git filter-repo` strips the `origin` remote as a safety measure — this is expected. Before pushing for real, `git remote set-url origin <real-remote-url>` to point at the actual host (not the local mirror clone), and verify with `git remote -v`.

5. Verify before publishing.
   - Re-run `du -sh .git`, `git count-objects -vH`, and `git filter-repo --analyze`.
   - `diff -rq` the rewritten working tree against the original to confirm content is unchanged (aside from intended removals).
   - Confirm important branches and tags still exist.
   - Run the repository's normal tests or at least a build/smoke check when practical.
   - Preserve `filter-repo/commit-map` if the user needs traceability from old commits to new commits.

6. Publish only after explicit approval — confirm twice: once for the rewrite plan, once immediately before the force-push naming the exact remote URL and old/new SHAs.
   - Explain that collaborators must rebase or reclone; merging old branches can reintroduce removed history.
   - Force-push branches and tags only after user approval and after checking branch/tag protections:

   ```sh
   git push origin --force 'refs/heads/*'
   git push origin --force 'refs/tags/*'
   ```

   - For GitHub sensitive-data removal, coordinate cached PR refs and server-side cleanup through GitHub Support. For GitLab, run the project cleanup/housekeeping process after pushing rewritten history.

7. Reconcile every other clone of the repo, including the user's original working copy:
   - `git fetch origin` then `git reset --hard origin/<branch>` if the working tree is clean and content-identical (confirm with the user — this discards the now-orphaned old local commit chain).
   - Other branches that still point at pre-rewrite history (e.g. open PR branches, automation branches) keep the old blobs reachable and will make `du -sh .git` stay large even after the rewritten branch is pushed and reset locally. Identify them with `git branch -r` and `gh pr list --state all --head <branch>`; branches tied only to merged/closed PRs are safe to delete (Light Mode step 2). Branches with open PRs need rebase/recreation — coordinate with their owners.
   - After deleting/rewriting all branches that reference old history, `git fetch --prune`, then run Light Mode step 5 (check for stray non-standard refs) before the final `gc --prune=now`. The size will not drop until literally every keep-alive ref pointing at old history is gone.

## Prevention

- Add build outputs, archives, generated assets, databases, and local data directories to `.gitignore`.
- Use Git LFS for large binary assets that must be versioned.
- Add pre-commit or CI checks for file-size limits when the repo has repeatedly accepted large blobs.
- Prefer artifact storage for release bundles, build products, datasets, and logs.

## Good Practice Notes

- `git gc` optimizes local storage and prunes unreachable objects after a grace period; it does not remove reachable large blobs from history.
- `git gc --prune=now` is unsafe while another Git process may be writing to the repository.
- `git gc --aggressive` can be slow; reserve it for one-off optimization after a rewrite or import.
- `git-filter-repo` is the preferred modern tool for history filtering; avoid `git filter-branch` unless the user explicitly requires it for an unusual environment.
- BFG Repo-Cleaner can be acceptable for simple large-file purges, but prefer `git-filter-repo` because it is actively recommended by major hosting docs and has richer analysis and rewrite options.
- Remote hosts may keep caches, pull-request refs, forks, or LFS objects after a push. Size may not drop on the server until host-side cleanup runs.

## Sources To Prefer When Updating Guidance

- Git documentation: `git-gc` and `git-maintenance`.
- `newren/git-filter-repo` documentation.
- Host documentation for GitHub or GitLab cleanup steps when the repository is hosted there.
