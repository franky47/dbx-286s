import { useLayoutEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const storageKey = 'dbx-theme'

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(storageKey)
    return isTheme(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme)

  useLayoutEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function applyTheme() {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    applyTheme()
    if (theme === 'system') {
      media.addEventListener('change', applyTheme)
      return () => media.removeEventListener('change', applyTheme)
    }
  }, [theme])

  function changeTheme(value: unknown) {
    if (!isTheme(value)) return
    setTheme(value)
    try {
      localStorage.setItem(storageKey, value)
    } catch {
      // Keep the choice for this visit when the browser blocks storage.
    }
  }

  return { theme, setTheme: changeTheme }
}
