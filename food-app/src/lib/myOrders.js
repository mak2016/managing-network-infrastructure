const STORAGE_KEY = 'food-app:my-orders'

export function getMyOrderIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function rememberOrder(orderId) {
  try {
    const ids = getMyOrderIds().filter((id) => id !== orderId)
    ids.unshift(orderId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, 20)))
  } catch {
    // localStorage unavailable (private browsing, etc.) — order tracking
    // still works via the direct link, it just won't show in "My orders".
  }
}
