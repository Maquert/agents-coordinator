---
name: swiftui-scrollview
description: >
  Expert guidance on SwiftUI ScrollView tips and tricks, with a focus on
  magnetic/snapping scroll effects. Use this skill whenever the user asks about
  SwiftUI ScrollView, scroll snapping, paging, magnetic scrolling, carousel
  layouts, scroll alignment, scrollTargetLayout, scrollTargetBehavior,
  viewAligned, or any "snap to item" effect in SwiftUI — even if they just say
  "make it snap" or "I want a carousel". Always load this skill for SwiftUI
  scroll-related questions.
---

# SwiftUI ScrollView — Tips & Tricks

## The Core Pattern: Magnetic Scrolling

To create a "magnetic" scroll effect (items snap into place as the user scrolls), combine **two modifiers**:

| Modifier | Applied to | Role |
|---|---|---|
| `.scrollTargetLayout()` | The layout container (`LazyHStack`, `HStack`, etc.) inside the `ScrollView` | Tells SwiftUI *which* views are the scroll targets |
| `.scrollTargetBehavior(.viewAligned)` | The `ScrollView` itself | Controls *how* scrolling snaps — decelerates and aligns to the nearest target view |

### Minimal working example

```swift
ScrollView(.horizontal) {
    LazyHStack(spacing: 16) {
        ForEach(items) { item in
            CardView(item: item)
                .frame(width: 300, height: 200)
        }
    }
    .scrollTargetLayout()          // ← on the layout container
}
.scrollTargetBehavior(.viewAligned) // ← on the ScrollView
```

## Modifier Breakdown

### `.scrollTargetLayout()`
- Marks every direct child of the container as a scroll target.
- Must be placed on the **layout container** (`LazyHStack`, `LazyVStack`, `HStack`, `VStack`), not on the `ScrollView` or individual items.
- Without this, `.scrollTargetBehavior` has nothing to snap to.

### `.scrollTargetBehavior(.viewAligned)`
- After the user lifts their finger, SwiftUI decelerates and aligns the scroll position to the nearest marked target.
- Alternative value: `.paging` — snaps by one full page instead of one item.
- Goes on the **`ScrollView`**, not the container.

## Common Variations

### Show partial next item (peek effect)
Add horizontal padding to the `ScrollView` content, then use `.scrollClipDisabled()` so the peeking card isn't clipped:

```swift
ScrollView(.horizontal) {
    LazyHStack(spacing: 12) {
        ForEach(items) { item in
            CardView(item: item)
                .frame(width: 280)
                .containerRelativeFrame(.horizontal)
        }
    }
    .scrollTargetLayout()
}
.scrollTargetBehavior(.viewAligned)
.scrollClipDisabled()
.contentMargins(.horizontal, 24, for: .scrollContent)
```

### Full-screen paging carousel
Use `.containerRelativeFrame` so each card fills the scroll view, then `.paging`:

```swift
ScrollView(.horizontal) {
    LazyHStack(spacing: 0) {
        ForEach(items) { item in
            CardView(item: item)
                .containerRelativeFrame(.horizontal)
        }
    }
    .scrollTargetLayout()
}
.scrollTargetBehavior(.paging)
```

### Programmatic scrolling to a target
Combine with `ScrollViewReader` and `.id()`:

```swift
ScrollViewReader { proxy in
    ScrollView(.horizontal) {
        LazyHStack {
            ForEach(items) { item in
                CardView(item: item)
                    .id(item.id)
            }
        }
        .scrollTargetLayout()
    }
    .scrollTargetBehavior(.viewAligned)
    Button("Jump to item 5") {
        withAnimation { proxy.scrollTo(items[4].id, anchor: .center) }
    }
}
```

## Availability

These APIs require **iOS 17 / macOS 14 / watchOS 10 / tvOS 17** or later.

For earlier targets, fall back to `TabView` with `.tabViewStyle(.page)` for basic paging, or a custom `DragGesture`-based approach.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No snapping at all | `.scrollTargetLayout()` missing or on wrong view | Move it to the direct layout container |
| Snaps to wrong position | Cards have unequal sizes / spacing | Ensure uniform frame widths and consistent spacing |
| Clips peeking cards | Default clip behavior | Add `.scrollClipDisabled()` to the `ScrollView` |
| Doesn't compile | Below iOS 17 deployment target | Gate with `if #available(iOS 17, *)` or use `TabView` fallback |

## Quick Reference

```
ScrollView                          ← .scrollTargetBehavior(.viewAligned)
  └── LazyHStack / HStack           ← .scrollTargetLayout()
        └── YourItemView            ← give it a fixed frame
```

Remember: **layout container gets `.scrollTargetLayout()`**, **ScrollView gets `.scrollTargetBehavior()`**. Swapping them is the most common mistake.
