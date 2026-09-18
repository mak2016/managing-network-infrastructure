export default function QtyStepper({ qty, onChange, min = 0 }) {
  return (
    <div className="qty-stepper">
      <button
        type="button"
        className="qty-stepper__btn"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="qty-stepper__value">{qty}</span>
      <button
        type="button"
        className="qty-stepper__btn"
        onClick={() => onChange(qty + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}
