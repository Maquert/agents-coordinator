---
name: screenshot-test-troubleshooter
description: Diagnose and fix screenshot, snapshot, visual-regression, and image-baseline test failures without blindly recording new references. Use when screenshot tests fail locally or in CI, rendered images differ unexpectedly, snapshot artifacts are blank or malformed, failures may be flaky or environment-specific, baselines may be stale, or an agent needs to decide whether to change UI code, the snapshot host, or reference images.
---

# Screenshot Test Troubleshooter

Find the smallest evidence-based fix. Do not assume every mismatch requires a
new baseline.

## Fast Path

1. Capture the exact failing test names, command, OS, SDK/Xcode version,
   destination, and reference directory.
2. Preserve the baseline, failed render, diff, logs, and result bundle before
   rerunning; many test runners overwrite temporary artifacts.
3. Rerun only the failed test methods once with the same environment and a
   fresh result bundle.
4. Inspect the baseline and failed render visually. Check image dimensions,
   crop/region, text, control glyphs, toolbar chrome, and blank or warning
   placeholders.
5. If the cause is still unclear, run the exact tests on untouched `main` with
   separate derived data, output, and result-bundle paths.
6. Classify the failure before editing code or references.

Never run competing screenshot commands in parallel when they share derived
data, build databases, simulators, output directories, or baseline files.

## Classification

| Evidence | Classification | Action |
| --- | --- | --- |
| Branch fails consistently; untouched `main` passes | Product or test regression | Fix code, fixture, host, region, or assertion; preserve the baseline |
| Intentional UI change renders correctly; `main` passes | Stale baseline | Record only impacted platform contracts, then verify |
| Branch and untouched `main` fail identically | Pre-existing baseline or environment drift | Do not update references in the feature branch; validate in the canonical environment and report the control result |
| Exact rerun passes and image output is unstable | Rendering nondeterminism | Rerun once more if cheap; preserve evidence; do not lower precision or churn baselines |
| Render is blank, cropped incorrectly, missing controls, or shows placeholder chrome | Broken snapshot host or settle behavior | Fix the host, lifecycle, size, region, or render timing before considering baselines |
| Expected and actual differ only because OS, font, locale, scale, appearance, or SDK changed | Environment drift | Match the canonical environment or use its dedicated baseline set |

Treat a control run on `main` as diagnostic evidence, not permission to modify
`main`. Use a clean checkout or worktree and separate mutable build paths.

## Inspect Artifacts

Read the test failure for actual artifact URLs or paths. When the framework
does not retain them, rerun the single failure with the repository-supported
artifact or result-bundle option.

Inspect both images, not only textual diff statistics:

- Confirm equal dimensions and expected display scale.
- Confirm the asserted crop still contains the intended control.
- Check for missing SF Symbols, button labels, focus rings, toolbar items,
  fonts, materials, and platform-native controls.
- Reject references containing warning symbols, orange/yellow placeholder
  bars, blank content, clipped sheets, or dropped navigation chrome.
- Determine whether differences are localized and intentional or broad and
  environmental.

For macOS SwiftUI, prefer an `NSHostingView` or window-hosted path when AppKit-
backed controls are involved. `ImageRenderer` can omit or corrupt interactive
control chrome. For navigation and toolbar assertions, first prove that the
chosen host renders that chrome.

## Use A Main Control

Use this control when failures are unrelated to the changed files, several
screens fail in a common visual pattern, or local and CI environments differ.

1. Confirm the feature branch is based on the intended `main` revision.
2. Run only the exact failed tests on untouched `main`.
3. Use unique derived-data and result-bundle paths; do not reuse the feature
   run's mutable outputs.
4. Compare test names, failure text, image differences, and environment.
5. If both runs fail identically, stop changing product code and baselines in
   the feature branch. Record the pre-existing/environment result clearly.

When repository policy requires CI-rendered references, use that CI workflow.
Local success or failure on a different OS/Xcode version cannot prove those
references are correct.

## Fix By Cause

### Product Or Fixture Regression

- Reduce to the smallest failing surface.
- Verify deterministic data, dates, UUIDs, locale, appearance, dynamic type,
  window size, and animation state.
- Fix the product or fixture, then rerun the focused test.
- Keep the old baseline unless the intended product output changed.

### Broken Host Or Region

- Confirm the host mounts the full hierarchy and platform chrome.
- Wait for layout and rendering using the repository's existing settle helper.
- Fix size, safe area, crop coordinates, or host selection.
- Do not record a malformed render as the new truth.

### Intentional Baseline Change

- Use the repository's canonical record wrapper.
- Record only impacted tests/platforms unless shared chrome changed broadly.
- Run platform recorders sequentially when they share build state.
- Inspect every changed reference, then rerun focused verification.
- Finish with the required broader suite.

### Flake Or Environment Drift

- Retry the exact failed tests, not the full suite first.
- Compare OS, SDK/Xcode, font availability, locale, scale, appearance, and
  reference-directory selection.
- Preserve a result bundle from a failure and a pass when possible.
- Do not hide instability by reducing snapshot precision or repeatedly
  recording whichever image appeared last.

## Validation Ladder

Run in this order and stop widening once the cause is proven:

1. Exact failed test method.
2. Dedicated screenshot class or changed screen contract.
3. Impacted platform screenshot suite.
4. Canonical cross-platform screenshot verification.
5. Full repository validation required before publication.

For Xcode output, save raw `xcodebuild` output and parse it with `xcsift`; do
not place another lossy filter before `xcsift`. Use a fresh `.xcresult` path
because Xcode refuses to overwrite an existing result bundle.

## Reporting

Report facts separately:

- Passing and failing test counts.
- Focused rerun outcome.
- Untouched-`main` control outcome when used.
- Environment and baseline directory.
- Files changed, especially reference images.
- Remaining uncertainty or required canonical-CI run.

Do not say the suite passed when unrelated or pre-existing screenshot failures
remain. State that the code-focused tests passed and list the independently
confirmed screenshot failures.
