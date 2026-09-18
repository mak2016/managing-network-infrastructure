import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import OrderProgress from '../components/OrderProgress.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useOrder } from '../hooks/useOrders.js'
import { useSettings } from '../hooks/useSettings.js'
import { formatDateTime, formatMoney } from '../lib/format.js'

export default function OrderTrackingPage() {
  const { orderId } = useParams()
  const { order, loading, error } = useOrder(orderId)
  const { settings } = useSettings()

  return (
    <div className="page page--order">
      <div className="page__topbar">
        <Link to="/">← Back to menu</Link>
        <h1>Order status</h1>
      </div>

      {loading && <EmptyState title="Loading order…" />}
      {error && <EmptyState title="Couldn't load this order" hint="Check the link and try again." />}
      {!loading && !error && !order && (
        <EmptyState title="Order not found" hint="This order may have been removed." />
      )}

      {order && (
        <div className="order-detail">
          <div className="order-detail__header">
            <span className="order-detail__id">Order #{order.id.slice(-6).toUpperCase()}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="order-detail__meta">
            {order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'} · placed{' '}
            {formatDateTime(order.createdAt)}
          </p>

          <OrderProgress fulfillment={order.fulfillment} status={order.status} />

          <ul className="order-detail__items">
            {order.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.qty} × {item.name}
                </span>
                <span>{formatMoney(item.price * item.qty, settings.currency)}</span>
              </li>
            ))}
          </ul>

          <div className="checkout-summary">
            <div className="checkout-summary__row">
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotal, settings.currency)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="checkout-summary__row">
                <span>Delivery fee</span>
                <span>{formatMoney(order.deliveryFee, settings.currency)}</span>
              </div>
            )}
            <div className="checkout-summary__row checkout-summary__row--total">
              <span>Total</span>
              <span>{formatMoney(order.total, settings.currency)}</span>
            </div>
          </div>

          {order.fulfillment === 'delivery' && order.customer?.address && (
            <p className="order-detail__meta">Delivering to: {order.customer.address}</p>
          )}
        </div>
      )}
    </div>
  )
}
