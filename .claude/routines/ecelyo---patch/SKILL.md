---
name: ecelyo---patch
description: Creates a new patch release
---

Execute the Xcode release publisher workflow to create a new patch version.

1. Merge the previous release-candidate branch with origin/main just to make sure the patch number has been update: that's the goal.
2. Overwrite the release-candidate branch with origin/main.
3. Bump the patch version in git.
4. Create release notes, tags, and documents; apply code changes.
5. Push to origin/release-candidate

Report the version number created, the platforms archived, and confirmation of TestFlight submission. If any step fails, halt and report the error.