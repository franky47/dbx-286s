import { createParser, parseAsBoolean, parseAsFloat, type UrlKeys } from 'nuqs'
import { controls, defaultSettings, type ControlId } from './controls'

const parseAsOnOff = createParser({
  ...parseAsBoolean,
  parse: (value) => {
    if (value !== 'on' && value !== 'off') return null
    return parseAsBoolean.parse(value === 'on' ? 'true' : 'false')
  },
  serialize: (value) => (value ? 'on' : 'off'),
}).withDefault(false)

function parseAsControl(id: ControlId) {
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
  }).withDefault(defaultSettings.values[id])
}

export const settingsParsers = {
  gain: parseAsControl('gain'),
  phantom: parseAsOnOff,
  highPass: parseAsOnOff,
  bypass: parseAsOnOff,
  drive: parseAsControl('drive'),
  density: parseAsControl('density'),
  frequency: parseAsControl('frequency'),
  deEss: parseAsControl('deEss'),
  low: parseAsControl('low'),
  high: parseAsControl('high'),
  threshold: parseAsControl('threshold'),
  ratio: parseAsControl('ratio'),
  output: parseAsControl('output'),
}

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
