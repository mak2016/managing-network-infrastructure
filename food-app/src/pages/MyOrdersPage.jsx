import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useOrder } from '../hooks/useOrders.js'
import { useSettings } from '../hooks/useSettings.js'
import { formatDateTime, formatMoney } from '../lib/format.js'
import { getMyOrderIds } from '../lib/myOrders.js'

function MyOrderRow({ orderId, currency }) {
  const { order, loading } = useOrder(orderId)

  if (loading || !order) return null

  return (
    <Link to={`/order/${orderId}`} className="my-order-row">
      <div>
        <p className="my-order-row__id">Order #{orderId.slice(-6).toUpperCase()}</p>
        <p className="my-order-row__meta">
          {formatDateTime(order.createdAt)} · {formatMoney(order.total, currency)}
        </p>
      </div>
      <StatusBadge status={order.status} />
    </Link>
  )
}

export default function MyOrdersPage() {
  const [orderIds, setOrderIds] = useState([])
  const { settings } = useSettings()

  useEffect(() => {
    setOrderIds(getMyOrderIds())
  }, [])

  return (
    <div className="page page--my-orders">
      <div className="page__topbar">
        <Link to="/">← Back to menu</Link>
        <h1>My orders</h1>
      </div>

      {orderIds.length === 0 ? (
        <EmptyState
          title="No orders yet"
          hint="Orders you place from this device will show up here."
        />
      ) : (
        <div className="my-order-list">
          {orderIds.map((id) => (
            <MyOrderRow key={id} orderId={id} currency={settings.currency} />
          ))}
        </div>
      )}
    </div>
  )
}
