# Element Measurer

The element measurer answers "how many pixels are between these two elements?" without opening DevTools.

## Activation

- **Hotkey** - default `Alt+Shift+M`.
- **Floating button** - the Measure button in the floating button.
- **Settings** - the floating button shortcuts tab can rebind the measurer hotkey.

## Flow

1. Toggle the measurer on.
2. Click one element. It becomes the anchor and is highlighted with `lineColor`.
3. Hover another element. Distance lines appear between the nearest edges of the two rectangles, with pixel labels.
4. If the elements share an edge or center within `alignmentTolerance` pixels, an alignment guide is drawn with `guideColor`.

Click a different element to replace the anchor. Press the hotkey again or `Escape` to exit.

## Configuration

```ts
createVueGrab({
  measurer: {
    enabled: true,
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

DevTools spacing overlays inspect one element at a time. The measurer gives direct pixel readings between arbitrary element pairs, including diagonally offset elements and alignment-guide near misses.
