import { useState } from 'react'
import { createSerializer, useQueryStates } from 'nuqs'
import { createSettingsParsers, settingsParsers, settingsUrlKeys } from '@/lib/query-state'
import { readDefaults, writeDefaults } from '@/lib/preset-storage'
import type { Preset } from '@/lib/controls'

const serialize = createSerializer(settingsParsers, {
  urlKeys: settingsUrlKeys,
  clearOnDefault: false,
})

export function usePreset() {
  const [storedDefaults, setStoredDefaults] = useState(readDefaults)
  const [error, setError] = useState('')
  const parsers = createSettingsParsers(storedDefaults)
  const defaults = Object.fromEntries(
    Object.entries(parsers).map(([key, parser]) => [key, parser.defaultValue]),
  ) as Preset
  const [settings, setSettings] = useQueryStates(parsers, { urlKeys: settingsUrlKeys })
  const modified = (Object.keys(defaults) as (keyof Preset)[]).some(
    (key) => settings[key] !== defaults[key],
  )

  function saveDefaults() {
    try {
      writeDefaults(settings)
      setStoredDefaults(settings)
      setError('')
    } catch {
      setError('Could not save defaults in this browser')
    }
  }

  async function reset() {
    try {
      await setSettings({})
      await setSettings(null, { history: 'push' })
      setError('')
    } catch {
      setError('Could not update the URL')
    }
  }

  function createPermalink() {
    const link = serialize(new URL(window.location.href), settings)
    try {
      void setSettings(settings, { history: 'replace', clearOnDefault: false }).catch(() => {})
    } catch {
      // The complete link can still be copied when the address bar cannot be updated.
    }
    return link
  }

  return { settings, setSettings, defaults, modified, error, saveDefaults, reset, createPermalink }
}
