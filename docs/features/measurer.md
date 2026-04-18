# Element Measurer

A spacing inspector that answers "how many pixels between these two elements?" without opening DevTools.

## Activation

- **Hotkey** — default `Alt+Shift+M`
- **Floating button** — the "Measure" button in the FAB
- **Programmatic** — `useGrab().toggleMeasurer()`

## Flow

1. Toggle the measurer on.
2. **Click** one element — it becomes the _anchor_, highlighted in the measurer's `lineColor`.
3. **Hover** any other element — distance lines appear between the nearest edges of the two rects, with pixel labels.
4. If the elements share an edge within `alignmentTolerance` pixels, an **alignment guide** is drawn in `guideColor`.

Click a second element to replace the anchor. Press the hotkey again (or `Escape`) to exit.

## Configuration

```ts
createVueGrab({
  measurer: {
    lineColor: "#06b6d4",
    guideColor: "#a855f7",
    lineWidth: 1,
    showAlignmentGuides: true,
    alignmentTolerance: 3,
  },
});
```

See the full [`MeasurerConfig`](../guide/configuration#measurer) table for defaults.

## Why not just use DevTools?

DevTools' spacing overlay requires inspecting one element at a time and mentally triangulating distances. The measurer gives you **direct pixel readings between arbitrary element pairs**, including diagonally offset ones — useful when an agent is asking "why is the label 17px too low?"
