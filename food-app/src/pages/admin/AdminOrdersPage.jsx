import { useState } from 'react'
import EmptyState from '../../components/EmptyState.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAllOrders } from '../../hooks/useOrders.js'
import { useSettings } from '../../hooks/useSettings.js'
import { formatDateTime, formatMoney } from '../../lib/format.js'
import { updateOrderStatus } from '../../lib/orders.js'
import { nextStatus, STATUS, STATUS_LABEL } from '../../lib/status.js'

const ACTIVE_STATUSES = new Set([
  STATUS.PLACED,
  STATUS.PREPARING,
  STATUS.READY,
  STATUS.OUT_FOR_DELIVERY,
])

export default function AdminOrdersPage() {
  const { orders, loading } = useAllOrders()
  const { settings } = useSettings()
  const [showAll, setShowAll] = useState(false)

  const visibleOrders = showAll ? orders : orders.filter((o) => ACTIVE_STATUSES.has(o.status))

  return (
    <div>
      <div className="admin-page__toolbar">
        <h1>Orders</h1>
        <label className="admin-page__toggle">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Show completed &amp; cancelled
        </label>
      </div>

      {loading && <EmptyState title="Loading orders…" />}
      {!loading && visibleOrders.length === 0 && (
        <EmptyState title="No orders here" hint="New orders will show up automatically." />
      )}

      <div className="admin-orders">
        {visibleOrders.map((order) => (
          <AdminOrderCard key={order.id} order={order} currency={settings.currency} />
        ))}
      </div>
    </div>
  )
}

function AdminOrderCard({ order, currency }) {
  const [updating, setUpdating] = useState(false)
  const upcoming = nextStatus(order.fulfillment, order.status)
  const canCancel = order.status !== STATUS.COMPLETED && order.status !== STATUS.CANCELLED

  async function moveTo(status) {
    setUpdating(true)
    try {
      await updateOrderStatus(order.id, status)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <article className="admin-order-card">
      <div className="admin-order-card__header">
        <div>
          <p className="admin-order-card__id">
            #{order.id.slice(-6).toUpperCase()} · {order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}
          </p>
          <p className="admin-order-card__meta">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="admin-order-card__items">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.qty} × {item.name}
          </li>
        ))}
      </ul>

      <p className="admin-order-card__total">{formatMoney(order.total, currency)}</p>

      <div className="admin-order-card__customer">
        <p>
          {order.customer?.name} · {order.customer?.phone}
        </p>
        {order.customer?.address && <p>{order.customer.address}</p>}
        {order.customer?.notes && <p className="admin-order-card__notes">"{order.customer.notes}"</p>}
      </div>

      <div className="admin-order-card__actions">
        {upcoming && (
          <button type="button" disabled={updating} onClick={() => moveTo(upcoming)}>
            Mark as {STATUS_LABEL[upcoming]}
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            className="admin-order-card__cancel"
            disabled={updating}
            onClick={() => moveTo(STATUS.CANCELLED)}
          >
            Cancel order
          </button>
        )}
      </div>
    </article>
  )
}
