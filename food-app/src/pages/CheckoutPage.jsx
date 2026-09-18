import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useSettings } from '../hooks/useSettings.js'
import { formatMoney } from '../lib/format.js'
import { rememberOrder } from '../lib/myOrders.js'
import { placeOrder } from '../lib/orders.js'

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const [fulfillment, setFulfillment] = useState('pickup')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (lines.length === 0) {
    return (
      <div className="page">
        <p>Your cart is empty.</p>
        <Link to="/">Back to menu</Link>
      </div>
    )
  }

  const deliveryFee = fulfillment === 'delivery' ? settings.deliveryFee || 0 : 0
  const total = subtotal + deliveryFee

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    setError(null)

    if (!name.trim() || !phone.trim()) {
      setError('Please enter your name and phone number.')
      return
    }
    if (fulfillment === 'delivery' && !address.trim()) {
      setError('Please enter a delivery address.')
      return
    }

    setSubmitting(true)
    try {
      const orderId = await placeOrder({
        items: lines,
        subtotal,
        deliveryFee,
        total,
        fulfillment,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: fulfillment === 'delivery' ? address.trim() : '',
          notes: notes.trim(),
        },
      })
      rememberOrder(orderId)
      clear()
      navigate(`/order/${orderId}`)
    } catch {
      setError('Something went wrong placing your order. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="page page--checkout">
      <div className="page__topbar">
        <Link to="/cart">← Back to cart</Link>
        <h1>Checkout</h1>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <fieldset className="fulfillment-toggle">
          <legend>How would you like your order?</legend>
          <label>
            <input
              type="radio"
              name="fulfillment"
              value="pickup"
              checked={fulfillment === 'pickup'}
              onChange={() => setFulfillment('pickup')}
            />
            Pickup
          </label>
          <label>
            <input
              type="radio"
              name="fulfillment"
              value="delivery"
              checked={fulfillment === 'delivery'}
              onChange={() => setFulfillment('delivery')}
            />
            Delivery
          </label>
        </fieldset>

        {fulfillment === 'pickup' && settings.pickupAddress && (
          <p className="checkout-form__hint">Pickup from: {settings.pickupAddress}</p>
        )}

        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label className="field">
          <span>Phone number</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>

        {fulfillment === 'delivery' && (
          <label className="field">
            <span>Delivery address</span>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} required />
          </label>
        )}

        <label className="field">
          <span>Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Allergies, delivery instructions, etc."
          />
        </label>

        <div className="checkout-summary">
          <div className="checkout-summary__row">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal, settings.currency)}</span>
          </div>
          {fulfillment === 'delivery' && (
            <div className="checkout-summary__row">
              <span>Delivery fee</span>
              <span>{formatMoney(deliveryFee, settings.currency)}</span>
            </div>
          )}
          <div className="checkout-summary__row checkout-summary__row--total">
            <span>Total</span>
            <span>{formatMoney(total, settings.currency)}</span>
          </div>
          <p className="checkout-form__hint">
            Payment on {fulfillment === 'delivery' ? 'delivery' : 'pickup'} — cash or as arranged
            with {settings.businessName}.
          </p>
        </div>

        {error && <p className="banner banner--error">{error}</p>}

        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </div>
  )
}
