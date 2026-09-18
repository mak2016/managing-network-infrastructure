import { Link, useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import QtyStepper from '../components/QtyStepper.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useSettings } from '../hooks/useSettings.js'
import { formatMoney } from '../lib/format.js'

export default function CartPage() {
  const { lines, subtotal, setQty, removeItem } = useCart()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const belowMinimum = settings.minOrder > 0 && subtotal < settings.minOrder

  return (
    <div className="page page--cart">
      <div className="page__topbar">
        <Link to="/">← Back to menu</Link>
        <h1>Your cart</h1>
      </div>

      {lines.length === 0 ? (
        <EmptyState title="Your cart is empty" hint="Add something from the menu to get started." />
      ) : (
        <>
          <ul className="cart-lines">
            {lines.map((line) => (
              <li key={line.id} className="cart-lines__row">
                <div>
                  <p className="cart-lines__name">{line.name}</p>
                  <p className="cart-lines__price">{formatMoney(line.price, settings.currency)} each</p>
                </div>
                <div className="cart-lines__controls">
                  <QtyStepper qty={line.qty} onChange={(qty) => setQty(line.id, qty)} />
                  <button
                    type="button"
                    className="cart-lines__remove"
                    onClick={() => removeItem(line.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="cart-total">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal, settings.currency)}</span>
          </div>

          {belowMinimum && (
            <p className="banner banner--warn">
              Minimum order is {formatMoney(settings.minOrder, settings.currency)}.
            </p>
          )}
          {!settings.isOpen && (
            <p className="banner banner--warn">We're currently closed and not taking orders.</p>
          )}

          <button
            type="button"
            className="primary-btn"
            disabled={belowMinimum || !settings.isOpen}
            onClick={() => navigate('/checkout')}
          >
            Checkout
          </button>
        </>
      )}
    </div>
  )
}
