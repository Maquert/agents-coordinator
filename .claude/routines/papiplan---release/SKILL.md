---
name: papiplan---release
description: Releases a new Papiplan build
---

Ecelyo Release Build Routine

Execute the Xcode Cloud release build workflow for the current version.

1. Fetch latest origin/main to ensure release-candidate includes all recent changes.
2. Reset release-candidate to origin/main (fast-forward to latest).
3. Push release-candidate to trigger Xcode Cloud build.
4. Verify MARKETING_VERSION matches the configured release version (do not modify).
5. Confirm push succeeded and build is queued.
6. Tag the pushed release-candidate commit as `release-<version>-<date>`, using
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