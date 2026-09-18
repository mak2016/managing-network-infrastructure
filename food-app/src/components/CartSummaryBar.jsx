import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { formatMoney } from '../lib/format.js'

export default function CartSummaryBar({ currency }) {
  const { itemCount, subtotal } = useCart()

  if (itemCount === 0) return null

  return (
    <Link to="/cart" className="cart-summary-bar">
      <span>
        {itemCount} item{itemCount === 1 ? '' : 's'}
      </span>
      <span>View cart · {formatMoney(subtotal, currency)}</span>
    </Link>
  )
}
