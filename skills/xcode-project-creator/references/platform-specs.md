# Platform Specs

Use these defaults when creating new Xcode projects. Always verify that simulator devices and runtimes exist in the active local Xcode before relying on them.

## Baseline Platform Policy

- Default UI/platform: iPhone.
- Additional platforms: ask the user which to support before scaffolding.
- Apple Watch: not supported from the beginning unless the user explicitly requests it.
- SwiftUI: default app UI framework for every selected platform.
- Entitlements: none by default; add the smallest required set only after capability confirmation.

## Preferred Simulator Devices

- iPhone: `iPhone 17`.
- iPad: `iPad (A16)`.
- Apple TV: `Apple TV 4K (2nd generation)`.
- visionOS: `Apple Vision Pro (2nd generation)`.

If a preferred device is unavailable locally, list matching available devices from `xcrun simctl list devicetypes available` and discuss the closest substitute before running builds.

## Platform Folder Names

Use these folder names for selected platforms:

- iPhone: `Platforms/iPhone/` and `Configuration/iPhone.xcconfig`.
- iPad: `Platforms/iPad/` and `Configuration/iPad.xcconfig`.
- Apple TV: `Platforms/TV/` and `Configuration/TV.xcconfig`.
- visionOS: `Platforms/Vision/` and `Configuration/Vision.xcconfig`.

Folders may contain only configuration at first. Keep them anyway for selected platforms so platform-specific tweaks have an obvious home.

## SDK Discussion

The active Xcode install defines the latest locally available iOS SDK. Before creation, inspect:

```bash
xcodebuild -version
xcodebuild -showsdks
xcrun --sdk iphonesimulator --show-sdk-version
```

Then tell the user which local SDK would be used. Do not claim a newer SDK exists unless it is installed locally or verified from an official Apple source.
