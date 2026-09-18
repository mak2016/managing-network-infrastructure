import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'food-app:cart'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // ignore storage failures (private browsing, quota, etc.)
    }
  }, [lines])

  const addItem = useCallback((item, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.id === item.id)
      if (existing) {
        return prev.map((line) =>
          line.id === item.id ? { ...line, qty: line.qty + qty } : line,
        )
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty }]
    })
  }, [])

  const setQty = useCallback((id, qty) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((line) => line.id !== id)
      return prev.map((line) => (line.id === id ? { ...line, qty } : line))
    })
  }, [])

  const removeItem = useCallback((id) => {
    setLines((prev) => prev.filter((line) => line.id !== id))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.qty, 0)
    const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0)
    return { lines, itemCount, subtotal, addItem, setQty, removeItem, clear }
  }, [lines, addItem, setQty, removeItem, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
