# DBX 286s

An interactive front-panel mock-up using [audiocn knobs](https://www.audiocn.dev/docs/components/knob). Only the unit appears on screen.

The ten knobs and the phantom power, high-pass filter, and process bypass switches update local React state. Bypass dims the four processor sections but keeps their values and lets you adjust them. Reloading restores the starting values.

This demo does not process audio, access a microphone, or control hardware. Meter LEDs stay off. Starting values are examples, not official dbx presets.

## Run

```sh
pnpm install
pnpm dev
```

## Use the controls

- Drag a knob up or down. Hold Shift for fine adjustment.
- Tab to a knob, then use arrow keys or the mouse wheel.
- Use Home and End for the limits. Alt+arrow makes a fine adjustment.
- Hover or focus a knob to see its value. Press Enter on the knob or double-click its value to type a number. Enter applies it; Escape cancels.
- Double-click a dial or Alt+click to restore its starting value.
- On a narrow screen, scroll the unit sideways. Keyboard focus also scrolls controls into view.

## Component source

The app copies audiocn source directly, without the registry namespace:

- [knob.json](https://www.audiocn.dev/r/knob.json) supplies `src/components/ui/knob.tsx`.
- [use-audio-config.json](https://www.audiocn.dev/r/use-audio-config.json) and [use-audio-context.json](https://www.audiocn.dev/r/use-audio-context.json) supply the hooks in `src/hooks/`.
- [core.json](https://www.audiocn.dev/r/core.json) supplies the four supporting files in `src/lib/audio/`.

The app formats the copied files with Oxfmt. The local `Knob` adds an optional `taper` prop for custom value-to-angle mapping. `PanelKnob` in `src/App.tsx` composes audiocn's `KnobDial`, `KnobLabel`, and `KnobValue` with a custom SVG cap and `UnitScale`. Click sounds remain off.

`src/lib/controls.ts` defines the starting values. `src/lib/graduations.ts` records the printed values from the close-up photos in `unit/`. All knobs use a 300-degree sweep. The frequency, gate, ratio, and output controls use linear interpolation between printed marks, so the pointer aligns with each label.

OFF uses -60 for the gate. The ratio control uses 1 as an internal MIN marker, not a claim that the hardware has a 1:1 ratio. Readouts below the printed 1.5:1 mark show MIN. You can type OFF or MIN where the panel uses those labels. These are visual approximations, not measured circuit curves. The [dbx product page](https://dbxpro.com/en-US/products/286s) lists the hardware specs.

## Check

```sh
pnpm exec playwright install chromium
pnpm test
pnpm check
pnpm build
```

Browser tests cover the panel-only layout, keyboard and drag input, typed values, reset, switches, narrow-screen access, pointer alignment with printed marks, and meter labels.
