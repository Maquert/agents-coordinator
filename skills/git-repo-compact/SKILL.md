---
name: git-repo-compact
description: Compact and shrink Git repositories by diagnosing object storage, running safe Git maintenance, and planning or executing large-blob history rewrites with git-filter-repo. Use when a user asks to reduce .git size, remove big blobs, clean repository history, garbage collect a repo, purge large committed files, migrate large files to LFS, recover space after a rewrite, prune a git repo, shrink disk usage of a repo, or make the repository take less space on disk.
metadata:
  short-description: Shrink Git repositories safely
---

# Git Repository Compaction

Use this skill to reduce repository size without losing useful history or surprising collaborators. Treat history rewriting as destructive: inspect first, back up or use a fresh clone, explain impact, and get explicit user confirmation before force-pushing or deleting original refs.

## Default Workflow

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

3. Choose the smallest safe remedy.
   - If space is mostly loose or unreachable objects, run ordinary maintenance:

   ```sh
   git gc
   ```

   - To reclaim space after a confirmed local-only rewrite or abandoned refs, and only when no other Git process is writing to the repo:

   ```sh
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

   - If large blobs are reachable from history, ordinary `git gc` will not remove them. Use `git-filter-repo` in a fresh clone or mirror clone.

4. Rewrite history only when necessary.
   - Install or verify `git-filter-repo` with `git filter-repo --version` or `git-filter-repo --version`.
   - Work in a fresh clone or mirror clone, not the user's only working copy.
   - Remove a specific path from all history:

   ```sh
   git filter-repo --path path/to/large-file --invert-paths
   ```

   - Remove every blob larger than a threshold:

   ```sh
   git filter-repo --strip-blobs-bigger-than 100M
   ```

   - If removing secrets or sensitive files, use the host-specific sensitive-data process and rotate credentials. Do not present repository compaction as sufficient secret remediation.

5. Verify before publishing.
   - Re-run `du -sh .git`, `git count-objects -vH`, and `git filter-repo --analyze`.
   - Confirm important branches and tags still exist.
   - Run the repository's normal tests or at least a build/smoke check when practical.
   - Preserve `filter-repo/commit-map` if the user needs traceability from old commits to new commits.

6. Publish only after explicit approval.
   - Explain that collaborators must rebase or reclone; merging old branches can reintroduce removed history.
   - Force-push branches and tags only after user approval and after checking branch/tag protections:

   ```sh
   git push origin --force 'refs/heads/*'
   git push origin --force 'refs/tags/*'
   ```

   - For GitHub sensitive-data removal, coordinate cached PR refs and server-side cleanup through GitHub Support. For GitLab, run the project cleanup/housekeeping process after pushing rewritten history.

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
