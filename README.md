# DBX 286s

An interactive front-panel mock-up using [audiocn knobs](https://www.audiocn.dev/docs/components/knob). Only the unit appears on screen.

The ten knobs and the phantom power, high-pass filter, and process bypass switches update local React state. Bypass dims the processor knobs, their labels and units, and the compressor, de-esser, and expander/gate meters. Section borders and titles stay unchanged. You can still adjust the knobs, and bypass keeps their values. Reloading restores the starting values.

This demo does not process audio, access a microphone, or control hardware. Meter LEDs stay off. Starting values are examples, not official dbx presets.

## Run

```sh
pnpm install
pnpm dev
```

## Use the controls

- Drag a knob up or down. Hold Shift to slow the drag.
- Tab to a knob, then use arrow keys or the mouse wheel.
- Use Home and End for the limits. Arrows, Alt+arrow, and the wheel move one position. Shift+arrow and Page Up/Down move ten positions.
- Hover or focus a knob to see its value. Press Enter on the knob or double-click its value to type a number. Enter applies it; Escape cancels.
- Double-click a dial or Alt+click to restore its starting value.
- On a narrow screen, scroll the unit sideways. Keyboard focus also scrolls controls into view.

All knobs have 41 fixed positions, including both limits. Positions are 7.5 degrees apart across the 300-degree sweep. Each knob keeps its printed marks and maps positions through its scale, so value steps can vary. Input gain uses 1.5 dB steps from 0 to +60 dB. Typed values snap to the nearest position. Shift and Alt cannot select values between positions.

Starting and reset values sit on fixed positions. Input gain starts at +34.5 dB, frequency at 4.4 kHz, and gate threshold at -36 dBu.

## Component source

The app copies audiocn source directly, without the registry namespace:

- [knob.json](https://www.audiocn.dev/r/knob.json) supplies `src/components/ui/knob.tsx`.
- [use-audio-config.json](https://www.audiocn.dev/r/use-audio-config.json) and [use-audio-context.json](https://www.audiocn.dev/r/use-audio-context.json) supply the hooks in `src/hooks/`.
- [core.json](https://www.audiocn.dev/r/core.json) supplies the four supporting files in `src/lib/audio/`.

The app formats the copied files with Oxfmt. The local `Knob` adds an optional `taper` prop for custom value-to-angle mapping. `PanelKnob` in `src/App.tsx` composes audiocn's `KnobDial`, `KnobLabel`, and `KnobValue` with a custom SVG cap and `UnitScale`. `PanelKnob` uses positions 1 through 41 internally and maps them to control values for state, typed input, readouts, and accessible slider values. Click sounds remain off.

`src/lib/controls.ts` defines the starting values. `src/lib/graduations.ts` records the printed values from the close-up photos in `unit/`. All knobs use a 300-degree sweep. The frequency, gate, ratio, and output controls use linear interpolation between printed marks, so the pointer aligns with each label.

OFF uses -60 for the gate. The ratio control uses 1 as an internal MIN marker, not a claim that the hardware has a 1:1 ratio. Only the minimum position shows MIN; higher positions show numeric ratios. You can type OFF or MIN where the panel uses those labels. These are visual approximations, not measured circuit curves. The [dbx product page](https://dbxpro.com/en-US/products/286s) lists the hardware specs.

## Check

```sh
pnpm exec playwright install chromium
pnpm test
pnpm check
pnpm build
```

Browser tests cover the panel-only layout, keyboard and drag input, typed values, reset, switches, narrow-screen access, pointer alignment with printed marks, meter labels, and clearance between labels, LEDs, meters, and section borders.
