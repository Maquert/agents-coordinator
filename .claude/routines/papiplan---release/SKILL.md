---
name: papiplan---release
description: Releases a new Papiplan build
---

Papiplan Release Build Routine

Execute the Xcode Cloud release build workflow for the current version.

1. Fetch latest origin/main and origin/release-candidate.
2. Reconcile release-candidate into main first, before ever resetting or
   force-pushing release-candidate: diff `origin/main..origin/release-candidate`.
   If release-candidate carries any commit not reachable from main (a hotfix,
   a tag-worthy fix, a release validation record, etc.), that commit must never
   be silently dropped. Merge release-candidate into main (open a PR, merge with
   a real merge commit — not squash/rebase — so release-candidate's commit SHAs
   remain ancestors of main) before proceeding. Only continue past this step once
   `origin/main` is a strict superset of `origin/release-candidate`.
3. Reset release-candidate to origin/main (now a true fast-forward, since step 2
   guarantees main contains everything release-candidate had).
4. Push release-candidate to trigger Xcode Cloud build.
5. Verify MARKETING_VERSION matches the configured release version (do not modify).
6. Confirm push succeeded and build is queued.
7. Tag the pushed release-candidate commit as `release-<version>-<date>`, using
   MARKETING_VERSION for `<version>` and today's date as `<date>` in `YYYY-MM-DD`
   format (example: `release-1.0-2026-12-20`). Push the tag to origin. This marks
   which commit a release was cut from; it does not track the Xcode Cloud build
   number, which must be checked separately in App Store Connect.

Report:

Current version (from MARKETING_VERSION)
release-candidate commit SHA
Platforms queued for build (macOS, iOS)
Confirmation that Xcode Cloud build was triggered
Tag created and pushed (name)

If any step fails, halt and report the error.