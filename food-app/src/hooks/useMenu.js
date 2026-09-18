import { useEffect, useState } from 'react'
import { subscribeToMenu } from '../lib/menu.js'

export function useMenu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToMenu(
      (nextItems) => {
        setItems(nextItems)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  return { items, loading, error }
}
