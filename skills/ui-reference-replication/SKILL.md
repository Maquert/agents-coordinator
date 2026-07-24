---
name: ui-reference-replication
description: Rebuild a user interface from a supplied golden screenshot or visual reference by measuring its geometry, decomposing it into visual groups, implementing each group, rendering at the reference size, and iterating through direct image comparison. Use when a UI must closely match a mockup, screenshot, design render, or fixed-size visual contract, especially when screenshot tests or native window chrome are involved.
---

# UI Reference Replication

## Overview

Treat the supplied reference as the visual source of truth. Reconstruct the interface in measured groups, render every meaningful pass at the same dimensions and appearance, compare the output directly with the reference, and hold publication until the result is close or a concrete blocker is documented.

## Workflow

### 1. Establish the visual contract

- Preserve the original reference. Inspect its pixel dimensions, display scale if known, appearance, locale, and whether it includes window, browser, device, or other host chrome.
- Separate host chrome from application content. Decide whether the implementation must match the full image or only the content crop, and make the snapshot host capture the same boundary.
- Determine whether the surface is fixed-size. For a fixed reference, lock the root content/window dimensions to the measured size instead of allowing an adaptive layout to drift.
- Record a compact geometry table before coding: overall size, region bounds, split ratios, anchors, row heights, padding, gaps, and footer/header heights.
- Treat reference-provided controls, colors, icons, and spacing as intentional even when they differ from the product design system. The reference wins for this task unless the user says otherwise.

### 2. Decompose into visual groups

- Divide the surface into independently tunable groups such as left/right panels, header, list, empty state, footer, toolbar, or action tiles.
- Give each meaningful group its own component/view when the framework supports it. Keep the parent as a thin composition layer and pass narrow inputs and actions.
- Identify repeated elements separately: action tile, row, icon treatment, button, badge, or footer control. A repeated element should have one geometry and styling definition.
- Preserve behavior while rebuilding appearance: opening, importing, deleting, reordering, focus, selection, keyboard access, and error states remain part of the contract.

### 3. Work in ordered passes

Complete one visual group before starting the next.

- Start with the most visually dominant group, commonly the left/hero/onboarding side. Match its structure, asset scale, typography, alignment, spacing, and action geometry.
- Render the fixed-size surface immediately after that group. Compare the output with the corresponding reference crop and tune only that group until its anchors are close.
- Continue with the next group, commonly the right/list/content side. Match headers, controls, row heights, selected state, separators, empty state, footer, and trailing affordances.
- Render the complete surface after each group. Do not rely on code inspection or confidence that the layout “should” match.
- If the unchanged group makes comparison difficult, use a temporary placeholder or crop for diagnosis, but do not leave the placeholder in the final implementation.

### 4. Render and compare rigorously

- Use the same width, height, scale, locale, color scheme, font environment, and data fixture for every comparison.
- Inspect the actual rendered PNG, not just a test result. Confirm dimensions, crop, text, controls, icons, focus rings, materials, and native chrome.
- Compare by anchors: panel boundary, top/bottom edges, baseline positions, icon bounds, row separators, button rectangles, and footer placement. Fix the largest systematic offset first.
- Distinguish a global displacement from a local mismatch. A repeated offset usually indicates safe-area, list-content, window-chrome, or host behavior; fix that boundary rather than nudging every child.
- Remove default framework spacing when it is not in the reference: list insets, scroll content margins, row separator insets, button padding, safe-area treatment, and adaptive minimum sizes.
- Use a native/window-backed render host for interactive controls. Static renderers can omit or corrupt native button, list, focus, toolbar, and navigation chrome.
- Do not lower precision or repeatedly record whichever image appeared last. A new reference is valid only after visual inspection confirms the host and geometry are correct.

### 5. Keep product quality intact

- Keep user-facing text in the product’s localization mechanism and add translations for supported locales. Do not replace semantic copy with temporary literals merely to make a render pass.
- Add accessibility labels, hints, and keyboard/focus behavior for newly visible controls. Hide decorative reference elements from assistive technology only when they have no action or meaning.
- Preserve existing domain behavior and platform contracts. Keep the visual work scoped to the referenced surface; record independent findings as follow-up work.
- Prefer exact reference styling over reusable design-system primitives when the user identifies the reference as the golden target, but avoid leaking reference-only constants into unrelated screens.

### 6. Validate and handle blockers

- Use the narrowest focused screenshot test first, followed by focused unit/accessibility tests. Widen only when the changed surface or repository policy requires it.
- Record a screenshot baseline only after the render has been visually compared. Verify the test passes without record mode against the saved baseline.
- Keep generated candidate images, failed renders, diffs, and result bundles separate while iterating so evidence is not overwritten.
- Do not call a suite passed when an unrelated test or compile error remains. Report passed checks and unrelated failures separately.
- If a repeated failure occurs outside the changed surface—such as a compiler timeout in an untouched file, a missing native host, or unavailable canonical renderer—do not modify unrelated product code to hide it. Preserve the candidate, document the exact blocker, and ask for the required environment decision.
- Do not trigger remote CI during visual iteration unless the user requests it. Local evidence is appropriate for tuning; use the repository’s canonical remote renderer only when the user or project policy requires publication-grade baselines.

### 7. Hold publication until approval

- Keep the worktree uncommitted or committed locally while the user reviews the visual candidate, according to the task’s normal workflow.
- Do not push, open a duplicate pull request, merge, or mark the task complete merely because the screenshot test passes. Wait until the visual result is approved or the user explicitly asks to publish.
- When a pull request already exists, update that branch and pull request; do not create a second PR for visual iterations.
- Before publishing, summarize the reference, measured geometry, rendered artifact path, focused validation, remaining environment limitations, and exact commit/PR state.

## Completion checklist

- [ ] Reference dimensions, chrome boundary, scale, appearance, and locale are recorded.
- [ ] Visual groups and repeated components are identified.
- [ ] Each group was rendered and compared before moving on.
- [ ] Fixed-size geometry and major anchors are close to the reference.
- [ ] Interactive controls use the correct native/window-backed host.
- [ ] Localization, accessibility, and existing behavior remain intact.
- [ ] The focused screenshot passes without record mode against the inspected baseline.
- [ ] Unrelated failures and blockers are documented precisely.
- [ ] Publication is held until user approval or explicit publish instruction.
