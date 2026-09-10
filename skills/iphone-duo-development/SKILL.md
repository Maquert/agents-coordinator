---
name: iphone-duo-development
description: Design, adapt, and validate SwiftUI or UIKit apps for Apple iPhone Duo, including dual-display poses, adaptive layouts, vertical system bars, hinge-aware effects, scene multiplicity, and Device Hub testing.
---

# iPhone Duo development

Use this skill when a task targets iPhone Duo or asks whether an iOS layout is ready for the
dual-display, foldable iPhone form factor. iPhone Duo is still iPhone: preserve iOS conventions and
prefer adaptive layouts that work across a continuum of sizes instead of device-specific screens.

## Source of truth

Consult Apple's current material before making platform assumptions:

- [Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- [Get ready for iPhone Duo](https://developer.apple.com/iphone-duo/)
- [Prepare your app for iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111461/)
- [Strike a pose with adaptive layouts](https://developer.apple.com/videos/play/tech-talks/111463/)
- [Raise the bar with iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111462/)
- [Leverage multiple displays and scenes](https://developer.apple.com/videos/play/tech-talks/111464/)
- [SwiftUI documentation](https://developer.apple.com/documentation/swiftui)

Apple's dedicated preparation article and Xcode 27.1 support are being expanded over time. Recheck
the linked Apple pages and release notes when the task starts; do not invent unavailable APIs.

## Layout requirements

- Build for resizing, not named hardware dimensions. Use SwiftUI size classes, layout margins, safe
  area insets, and standard containers.
- Treat the outer display as a compact iPhone experience and the inner display as a regular-width
  experience that can support side-by-side content.
- Use `NavigationSplitView`, arrangement views, and existing adaptive navigation patterns where they
  match the information hierarchy. Keep navigation containers outside arrangement containers.
- Avoid fixed widths, `UIScreen.main`, orientation-based layout decisions, and assumptions that there
  is one display. When a screen is needed, obtain it from the relevant window scene; use scene bounds,
  traits, or size classes for layout.
- Respect reserved regions: hinge, cameras, Dynamic Island, status bar, and asymmetric safe areas.
  Use iOS 26+ Concentricity APIs such as `ConcentricRectangle` where the surface follows display
  corners.
- Keep the same state and functionality across displays. Reveal additional hierarchy on the inner
  display only when it improves the existing information architecture.

## Bars and controls

- Let the system move toolbars, tab bars, and navigation controls to the vertical side placement on
  the outer display and inner landscape. Do not manually recreate this axis or override it without a
  demonstrated product need.
- Keep related actions in `ToolbarItemGroup`; use symbols instead of text where space is constrained.
- Prefer the system overflow behavior and configure visibility priorities only when the default order
  does not preserve the most important actions.
- Keep controls stable as the device changes pose; avoid dramatic movement or disappearing actions.

## Multiple displays and hinge behavior

- Apps that support multiple scenes on iPad should support iPhone Duo's multiple app instances; handle
  scene-request failures because new windows cannot be created on the outer display.
- Use scene accessories when supplementary content genuinely belongs on the other display. Observe
  availability and disable controls when the accessory is unavailable.
- Use SwiftUI `onHingeChange` (or UIKit `UIHingeInteraction`) for effects driven by hinge state or
  angle. Use arrangement and region APIs for layout; do not derive layout from hinge angles.
- Camera-specific `CameraCaptureAccessory` behavior applies only to camera experiences; do not use it
  for ordinary Ecelyo content.

## Validation

- Build with the latest Xcode and iOS SDK that Apple documents for iPhone Duo (currently Xcode 27.1
  beta material is referenced by Apple's preparation page).
- Test in Device Hub/iPhone Duo simulator across closed, open, partially folded, portrait, landscape,
  Split View, and constrained-resizing poses.
- Verify outer and inner displays, hinge and camera reserved regions, safe areas, vertical bars,
  multiple scenes, accessibility, Dynamic Type, light/dark appearance, and state continuity.
- Add focused SwiftUI screenshot/UI tests for compact and regular size classes; supplement them with
  manual pose checks because a static screenshot cannot exercise hinge or scene transitions.

## Ecelyo-specific guidance

For Ecelyo, start by auditing shared SwiftUI shells and navigation bars for fixed geometry and
single-screen assumptions. Preserve the system → project → tactic → task hierarchy, let the inner
display expose more of that hierarchy through adaptive split content, and keep persistence and server
work independent from pose/layout calculations.
