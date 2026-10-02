export const controls = {
  gain: { label: 'Mic gain', min: 0, max: 60, step: 1, unit: 'dB' },
  drive: { label: 'Drive', min: 0, max: 10, step: 0.1, unit: '' },
  density: { label: 'Density', min: 0, max: 10, step: 0.1, unit: '' },
  frequency: { label: 'Frequency', min: 800, max: 10000, step: 100, unit: 'Hz' },
  deEss: { label: 'De-esser threshold', min: 0, max: 10, step: 0.1, unit: '' },
  low: { label: 'LF detail', min: 0, max: 10, step: 0.1, unit: '' },
  high: { label: 'HF detail', min: 0, max: 10, step: 0.1, unit: '' },
  threshold: { label: 'Gate threshold', min: -60, max: 15, step: 1, unit: 'dBu' },
  ratio: { label: 'Ratio', min: 1, max: 10, step: 0.1, unit: ':1' },
  output: { label: 'Output gain', min: -30, max: 10, step: 1, unit: 'dB' },
} as const

export type ControlId = keyof typeof controls
type Settings = {
  values: Record<ControlId, number>
  phantom: boolean
  highPass: boolean
  bypass: boolean
}
export type SwitchId = Exclude<keyof Settings, 'values'>

export const defaultSettings: Settings = {
  values: {
    gain: 35,
    drive: 3,
    density: 4,
    frequency: 4500,
    deEss: 5,
    low: 2,
    high: 3,
    threshold: -35,
    ratio: 2,
    output: 0,
  },
  phantom: false,
  highPass: true,
  bypass: false,
}

const decimal = (value: number) => String(Number(value.toFixed(2)))
const signed = (value: number) => `${value > 0 ? '+' : ''}${decimal(value)}`
const offAtZero = (value: number) => (value === 0 ? 'OFF' : decimal(value))

const valueFormats: Record<ControlId, (value: number) => string> = {
  gain: (value) => `${signed(value)} dB`,
  drive: offAtZero,
  density: offAtZero,
  frequency: (value) => `${decimal(value / 1000)} kHz`,
  deEss: offAtZero,
  low: offAtZero,
  high: offAtZero,
  threshold: (value) => (value <= -60 ? 'OFF' : `${decimal(value)} dBu`),
  ratio: (value) => (value < 1.5 ? 'MIN' : `${decimal(value)}:1`),
  output: (value) => `${signed(value)} dB`,
}

export function formatValue(id: ControlId, value: number): string {
  return valueFormats[id](value)
}
