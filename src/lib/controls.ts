export const controls = {
  gain: { label: 'Mic gain', min: 0, max: 60, unit: 'dB' },
  drive: { label: 'Drive', min: 0, max: 10, unit: '' },
  density: { label: 'Density', min: 0, max: 10, unit: '' },
  frequency: { label: 'Frequency', min: 800, max: 10000, unit: 'Hz' },
  deEss: { label: 'De-esser threshold', min: 0, max: 10, unit: '' },
  low: { label: 'LF detail', min: 0, max: 10, unit: '' },
  high: { label: 'HF detail', min: 0, max: 10, unit: '' },
  threshold: { label: 'Gate threshold', min: -60, max: 15, unit: 'dBu' },
  ratio: { label: 'Ratio', min: 1, max: 10, unit: ':1' },
  output: { label: 'Output gain', min: -30, max: 10, unit: 'dB' },
} as const

export type ControlId = keyof typeof controls
type Settings = {
  values: Record<ControlId, number>
  phantom: boolean
  highPass: boolean
  bypass: boolean
}
export type SwitchId = Exclude<keyof Settings, 'values'>
export type Preset = Record<ControlId, number> & Record<SwitchId, boolean>

export const defaultSettings: Settings = {
  values: {
    gain: 57,
    drive: 3.5,
    density: 5.25,
    frequency: 7200,
    deEss: 2.5,
    low: 3,
    high: 2.25,
    threshold: -45,
    ratio: 1.3,
    output: 2,
  },
  phantom: false,
  highPass: false,
  bypass: false,
}

const decimal = (value: number) => value.toFixed(2)
const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`
const offAtZero = (value: number) => (value === 0 ? 'OFF' : decimal(value))

const valueFormats: Record<ControlId, (value: number) => string> = {
  gain: (value) => `${signed(value)} dB`,
  drive: offAtZero,
  density: offAtZero,
  frequency: (value) => `${decimal(value / 1000)} kHz`,
  deEss: offAtZero,
  low: offAtZero,
  high: offAtZero,
  threshold: (value) => (value <= -60 ? 'OFF' : `${value.toFixed(1)} dBu`),
  ratio: (value) => (value === 1 ? 'MIN' : `${decimal(value)}:1`),
  output: (value) => `${signed(value)} dB`,
}

export function formatValue(id: ControlId, value: number): string {
  return valueFormats[id](value)
}
