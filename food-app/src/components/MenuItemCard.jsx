import { useCart } from '../context/CartContext.jsx'
import { formatMoney } from '../lib/format.js'
import QtyStepper from './QtyStepper.jsx'

export default function MenuItemCard({ item, currency }) {
  const { lines, addItem, setQty } = useCart()
  const line = lines.find((l) => l.id === item.id)
  const qty = line?.qty ?? 0

  return (
    <article className={'menu-item' + (item.available === false ? ' menu-item--unavailable' : '')}>
      {item.imageUrl && (
        <img className="menu-item__image" src={item.imageUrl} alt="" loading="lazy" />
      )}
      <div className="menu-item__body">
        <div className="menu-item__heading">
          <h3>{item.name}</h3>
          <span className="menu-item__price">{formatMoney(item.price, currency)}</span>
        </div>
        {item.description && <p className="menu-item__description">{item.description}</p>}

        {item.available === false ? (
          <span className="menu-item__sold-out">Sold out</span>
        ) : qty > 0 ? (
          <QtyStepper qty={qty} onChange={(next) => setQty(item.id, next)} />
        ) : (
          <button type="button" className="menu-item__add" onClick={() => addItem(item)}>
            Add
          </button>
        )}
      </div>
    </article>
  )
}
