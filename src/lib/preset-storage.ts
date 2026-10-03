import { controls, type ControlId, type Preset, type SwitchId } from './controls'

const storageKey = 'dbx-defaults'

function isControlValue(id: ControlId, value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= controls[id].min &&
    value <= controls[id].max
  )
}

function validateDefaults(stored: unknown): Partial<Preset> {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {}
  const values = stored as Record<string, unknown>
  const knobs = (Object.keys(controls) as ControlId[]).flatMap((id) =>
    isControlValue(id, values[id]) ? [[id, values[id]]] : [],
  )
  const switches = (['phantom', 'highPass', 'bypass'] as SwitchId[]).flatMap((id) =>
    typeof values[id] === 'boolean' ? [[id, values[id]]] : [],
  )
  return Object.fromEntries([...knobs, ...switches])
}

export function readDefaults(): Partial<Preset> {
  try {
    return validateDefaults(JSON.parse(localStorage.getItem(storageKey) ?? 'null'))
  } catch {
    return {}
  }
}

export function writeDefaults(settings: Preset) {
  localStorage.setItem(storageKey, JSON.stringify(settings))
}
