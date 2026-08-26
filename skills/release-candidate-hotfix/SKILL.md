---
name: release-candidate-hotfix
description: Apply urgent fixes to the release-candidate branch with 99% confidence before pushing. Requires local build verification to prevent cascading failures.
---

# Release Candidate Hotfix Workflow

Use this skill when the current release-candidate build is failing and needs an urgent fix. **Critical: Do NOT push to release-candidate until local build verification confirms 100% success.**

## Procedure

1. **Apply the fix to main branch first**
   - Navigate to the primary repo: `cd ~/Developer/Projects/ecelyo_app`
   - Understand the root cause by examining compilation errors
   - Make the necessary code changes to fix the build issue

2. **Local Build Verification (MANDATORY - 99% guarantee requirement)**
   - Build locally: `xcodebuild build -project Ecelyo.xcodeproj -scheme Ecelyo -configuration Release -derivedDataPath .derivedData/Release 2>&1 | grep -E "error:"`
   - **DO NOT proceed if there are any errors** — fix all issues first
   - Verify the output shows ZERO errors
   - Only after confirming zero errors, proceed to commit

3. **Commit and push to main**
   - `git add [files]`
   - `git commit -m "Fix [issue description]"`
   - `git push origin main`

4. **Sync release-candidate with the fix**
   - Navigate to release worktree: `cd ~/Developer/Projects/ecelyo_app-release`
   - Fetch and update: `git fetch origin && git reset --hard origin/main`
   - Push to release-candidate: `git push origin release-candidate --force-with-lease`

5. **Verify Xcode Cloud rebuild**
   - Monitor the next build
   - Confirm the build succeeds

## Critical Requirements

- **100% local build verification BEFORE any push** — compile locally and confirm zero errors
- **Find and fix ALL errors**, not just the first one visible
- **Do not push** until you have 99% guarantee no failures will happen
- **Understand root causes** — don't just apply surface-level fixes
- **Test thoroughly** — different architectures (x86_64, arm64), different configurations

## Why This Order

- Local build verification prevents cascading failures that waste Xcode Cloud build time
- Fixes go to main first because it's the source of truth
- release-candidate gets synced from main, not modified separately
- User doesn't have to keep telling you about new errors
