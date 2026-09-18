import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, subscribeToSettings } from '../lib/settings.js'

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToSettings(
      (next) => {
        setSettings(next)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [])

  return { settings, loading }
}
