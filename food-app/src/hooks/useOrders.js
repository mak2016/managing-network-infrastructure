import { useEffect, useState } from 'react'
import { subscribeToAllOrders, subscribeToOrder } from '../lib/orders.js'

export function useOrder(orderId) {
  const [order, setOrder] = useState(undefined) // undefined = loading, null = not found
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orderId) return
    setOrder(undefined)
    const unsubscribe = subscribeToOrder(orderId, setOrder, setError)
    return unsubscribe
  }, [orderId])

  return { order, loading: order === undefined && !error, error }
}

export function useAllOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToAllOrders(
      (next) => {
        setOrders(next)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  return { orders, loading, error }
}
