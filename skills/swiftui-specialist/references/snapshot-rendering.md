# Snapshot Rendering on macOS

## ImageRenderer Limitations

`ImageRenderer` renders SwiftUI view hierarchies into images without a hosting window. This works for static content (`Text`, `Image`, shapes, `VStack`/`HStack` layout) but **does not correctly render interactive AppKit-backed controls** on macOS:

- `TextField`, `TextEditor` — yellow/orange bar artifacts, missing text
- `Picker`, `Toggle`, `Stepper` — broken or missing chrome
- `DatePicker`, `ColorPicker` — incomplete rendering

These controls depend on AppKit's `NSView` lifecycle (window attachment, display layer, focus ring) which `ImageRenderer` bypasses.

## When to use ImageRenderer

Use `ImageRenderer` only when the view hierarchy contains **no interactive controls** — for example, card layouts, labels, decorative views, or shapes.

```swift
let renderer = ImageRenderer(content: myStaticView.frame(width: 300, height: 200))
renderer.scale = 1
let cgImage = renderer.cgImage
```

## When to use NSHostingView

For any view that contains interactive controls, use `NSHostingView` with `NSBitmapImageRep.cacheDisplay(in:to:)`. This goes through the full AppKit rendering pipeline.

```swift
import AppKit

let hostingView = NSHostingView(
    rootView: content
        .frame(width: size.width, height: size.height)
        .background(Color(nsColor: .windowBackgroundColor))
        .environment(\.colorScheme, .light)
)
hostingView.frame = CGRect(origin: .zero, size: size)
hostingView.appearance = NSAppearance(named: .aqua)  // or .darkAqua
hostingView.setFrameSize(size)
hostingView.layoutSubtreeIfNeeded()

guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: Int(size.width),
    pixelsHigh: Int(size.height),
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
) else { return nil }

bitmap.size = size
hostingView.cacheDisplay(in: hostingView.bounds, to: bitmap)

let image = NSImage(size: size)
image.addRepresentation(bitmap)
```

## Decision Rule

Before writing a macOS snapshot test, check the view under test:

1. Contains only `Text`, `Image`, shapes, layout containers -> `ImageRenderer` is fine.
2. Contains `TextField`, `Picker`, `Toggle`, or any other interactive control -> use `NSHostingView`.
3. Unsure -> default to `NSHostingView`. It works for all view types.
