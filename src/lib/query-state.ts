import { createParser, parseAsBoolean, parseAsFloat, type UrlKeys } from 'nuqs'
import { controls, defaultSettings, type ControlId, type Preset } from './controls'

const parseAsOnOff = createParser({
  ...parseAsBoolean,
  parse: (value) => {
    if (value !== 'on' && value !== 'off') return null
    return parseAsBoolean.parse(value === 'on' ? 'true' : 'false')
  },
  serialize: (value) => (value ? 'on' : 'off'),
})

function parseAsControl(id: ControlId, storedValue?: number) {
  const { min, max } = controls[id]
  return createParser({
    ...parseAsFloat,
    parse: (query) => {
      if (query.trim() === '') return null
      const text = query.trim()
      const isKilohertz = id === 'frequency' && /^\d+(?:\.\d+)?k$/.test(text)
      const value = isKilohertz ? Number(text.slice(0, -1)) * 1000 : Number(text)
      return Number.isFinite(value) && value >= min && value <= max ? value : null
    },
    serialize: (value) => (id === 'frequency' ? `${value / 1000}k` : parseAsFloat.serialize(value)),
  }).withDefault(storedValue ?? defaultSettings.values[id])
}

export function createSettingsParsers(stored: Partial<Preset> = {}) {
  return {
    gain: parseAsControl('gain', stored.gain),
    phantom: parseAsOnOff.withDefault(stored.phantom ?? defaultSettings.phantom),
    highPass: parseAsOnOff.withDefault(stored.highPass ?? defaultSettings.highPass),
    bypass: parseAsOnOff.withDefault(stored.bypass ?? defaultSettings.bypass),
    drive: parseAsControl('drive', stored.drive),
    density: parseAsControl('density', stored.density),
    frequency: parseAsControl('frequency', stored.frequency),
    deEss: parseAsControl('deEss', stored.deEss),
    low: parseAsControl('low', stored.low),
    high: parseAsControl('high', stored.high),
    threshold: parseAsControl('threshold', stored.threshold),
    ratio: parseAsControl('ratio', stored.ratio),
    output: parseAsControl('output', stored.output),
  }
}

export const settingsParsers = createSettingsParsers()

export const settingsUrlKeys: UrlKeys<typeof settingsParsers> = {
  gain: 'ingain',
  phantom: '48v',
  highPass: 'hp',
  bypass: 'bypass',
  drive: 'drive',
  density: 'density',
  frequency: 'deessfreq',
  deEss: 'deessthresh',
  low: 'lfdetail',
  high: 'hfdetail',
  threshold: 'gatethresh',
  ratio: 'gateratio',
  output: 'outgain',
}
