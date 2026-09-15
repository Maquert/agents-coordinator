#!/usr/bin/env python3
"""Read-only inventory for stale local Git data."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def run_git(repo: Path, *args: str, check: bool = True) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if check and result.returncode:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"git {' '.join(args)} failed: {detail}")
    return result.stdout


def parse_age(value: str) -> int:
    match = re.fullmatch(r"(\d+)([dhm]?)", value.strip().lower())
    if not match:
        raise argparse.ArgumentTypeError("age must look like 2d, 48h, or 120m")
    amount = int(match.group(1))
    unit = match.group(2) or "d"
    return amount * {"d": 86400, "h": 3600, "m": 60}[unit]


def parse_worktrees(text: str) -> list[dict[str, str | bool]]:
    entries: list[dict[str, str | bool]] = []
    current: dict[str, str | bool] = {}
    for line in text.splitlines() + [""]:
        if not line:
            if current:
                entries.append(current)
                current = {}
            continue
        key, _, value = line.partition(" ")
        if key == "worktree":
            current["path"] = value
        elif key == "HEAD":
            current["head"] = value
        elif key == "branch":
            current["branch"] = value.removeprefix("refs/heads/")
        elif key == "prunable":
            current["prunable"] = True
    return entries


def is_merged(repo: Path, branch: str, integration: str) -> bool | None:
    integration_ref = f"refs/heads/{integration}"
    if subprocess.run(
        ["git", "show-ref", "--verify", "--quiet", integration_ref],
        cwd=repo,
        check=False,
    ).returncode:
        return None
    return subprocess.run(
        ["git", "merge-base", "--is-ancestor", f"refs/heads/{branch}", integration_ref],
        cwd=repo,
        check=False,
    ).returncode == 0


def audit_repo(repo_arg: str, args: argparse.Namespace, now: int) -> dict:
    requested = Path(repo_arg).expanduser().resolve()
    if not requested.exists():
        raise RuntimeError(f"repository path does not exist: {requested}")
    root = Path(run_git(requested, "rev-parse", "--show-toplevel").strip()).resolve()

    fetch_error = None
    if args.fetch:
        result = subprocess.run(
            ["git", "fetch", "--prune"],
            cwd=root,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode:
            fetch_error = result.stderr.strip() or result.stdout.strip()

    current = run_git(root, "symbolic-ref", "--short", "-q", "HEAD").strip() or None
    status = run_git(root, "status", "--porcelain=v1")
    remotes = run_git(root, "remote").split()
    remote_prefix = f"refs/remotes/{args.remote}/"
    refs = run_git(
        root,
        "for-each-ref",
        "--format=%(refname)%09%(objectname)%09%(committerdate:unix)%09%(committerdate:iso8601-strict)",
        "refs/heads",
        f"refs/remotes/{args.remote}",
    )

    local: dict[str, dict] = {}
    remote_names: set[str] = set()
    for line in refs.splitlines():
        ref, object_name, timestamp, date = line.split("\t", 3)
        if ref.startswith("refs/heads/"):
            local[ref.removeprefix("refs/heads/")] = {
                "object": object_name,
                "timestamp": int(timestamp),
                "date": date,
            }
        elif ref.startswith(remote_prefix):
            remote_names.add(ref.removeprefix(remote_prefix))

    integration = args.integration
    worktrees = parse_worktrees(run_git(root, "worktree", "list", "--porcelain"))
    for entry in worktrees:
        path = Path(str(entry["path"]))
        if not path.exists():
            entry["missing"] = True
            entry["status"] = []
            continue
        try:
            entry["status"] = run_git(path, "status", "--porcelain=v1").splitlines()
        except RuntimeError as error:
            entry["status_error"] = str(error)

    worktree_branches: dict[str, list[str]] = {}
    for entry in worktrees:
        branch = entry.get("branch")
        if isinstance(branch, str):
            worktree_branches.setdefault(branch, []).append(str(entry["path"]))

    cutoff = now - args.older_than
    protected = set(args.protect) | {current, integration, "main", "master", "develop", "release-candidate"}
    protected.discard(None)
    branches = []
    for name, data in local.items():
        same_named_remote = name in remote_names
        age_seconds = max(0, now - data["timestamp"])
        candidate = data["timestamp"] < cutoff and not same_named_remote
        merged = is_merged(root, name, integration)
        paths = worktree_branches.get(name, [])
        branches.append(
            {
                "name": name,
                "last_commit": data["date"],
                "age_days": round(age_seconds / 86400, 2),
                "same_named_remote": same_named_remote,
                "stale_candidate": candidate,
                "checked_out": name == current,
                "worktrees": paths,
                "merged_into_integration": merged,
                "protected": name in protected,
            }
        )

    return {
        "repository": str(root),
        "current_branch": current,
        "integration_branch": integration,
        "remote": args.remote,
        "known_remotes": remotes,
        "fetched": args.fetch,
        "fetch_error": fetch_error,
        "cutoff": datetime.fromtimestamp(cutoff, tz=timezone.utc).isoformat(),
        "uncommitted_files": status.splitlines(),
        "uncommitted_on_integration": current == integration and bool(status),
        "dirty_integration_worktrees": [
            {
                "path": entry["path"],
                "branch": entry.get("branch"),
                "status": entry.get("status", []),
            }
            for entry in worktrees
            if entry.get("branch") == integration and entry.get("status")
        ],
        "worktrees": worktrees,
        "branches": sorted(branches, key=lambda item: item["last_commit"]),
    }


def print_report(reports: list[dict]) -> None:
    for report in reports:
        print(f"Repository: {report['repository']}")
        print(f"  current: {report['current_branch'] or '(detached)'}")
        print(f"  cutoff: {report['cutoff']}")
        print(f"  remote: {report['remote']} ({'known' if report['remote'] in report['known_remotes'] else 'missing'})")
        if report["fetch_error"]:
            print(f"  fetch_error: {report['fetch_error']}")
        if report["uncommitted_files"]:
            print("  uncommitted:")
            for line in report["uncommitted_files"]:
                print(f"    {line}")
        print("  stale_candidates:")
        candidates = [branch for branch in report["branches"] if branch["stale_candidate"]]
        if not candidates:
            print("    none")
        for branch in candidates:
            print(
                f"    {branch['name']} | {branch['last_commit']} | {branch['age_days']}d | "
                f"active={branch['checked_out']} | worktrees={len(branch['worktrees'])} | "
                f"merged={branch['merged_into_integration']} | protected={branch['protected']}"
            )
        print("  worktrees:")
        for entry in report["worktrees"]:
            print(f"    {entry}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", action="append", required=True, help="repository/worktree path; repeatable")
    parser.add_argument("--older-than", type=parse_age, default=2 * 86400)
    parser.add_argument("--remote", default="origin")
    parser.add_argument("--integration", default="main")
    parser.add_argument("--protect", action="append", default=[])
    parser.add_argument("--fetch", action="store_true", help="refresh remote refs with git fetch --prune")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    now = int(datetime.now(tz=timezone.utc).timestamp())
    reports = []
    failed = False
    for repo in args.repo:
        try:
            reports.append(audit_repo(repo, args, now))
        except (OSError, RuntimeError, ValueError) as error:
            failed = True
            print(f"ERROR {repo}: {error}", file=sys.stderr)
    if args.json:
        print(json.dumps(reports, indent=2))
    else:
        print_report(reports)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
