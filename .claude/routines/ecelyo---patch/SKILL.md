---
name: ecelyo---patch
description: Creates a new patch release
---

Ecelyo Release Build Routine (v2)

Execute the Xcode Cloud release build workflow for the current version.

1. Fetch latest origin/main to ensure release-candidate includes all recent changes.
2. Reset release-candidate to origin/main (fast-forward to latest).
3. Push release-candidate to trigger Xcode Cloud build.
4. Verify MARKETING_VERSION matches the configured release version (do not modify).
5. Confirm push succeeded and build is queued.

Report:

Current version (from MARKETING_VERSION)
release-candidate commit SHA
Platforms queued for build (macOS, iOS, visionOS)
Confirmation that Xcode Cloud build was triggered

If any step fails, halt and report the error.