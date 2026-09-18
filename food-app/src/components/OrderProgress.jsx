import { STATUS, STATUS_LABEL, statusSequence } from '../lib/status.js'

export default function OrderProgress({ fulfillment, status }) {
  if (status === STATUS.CANCELLED) {
    return <p className="order-progress__cancelled">This order was cancelled.</p>
  }

  const steps = statusSequence(fulfillment)
  const currentIndex = steps.indexOf(status)

  return (
    <ol className="order-progress">
      {steps.map((step, index) => (
        <li
          key={step}
          className={
            'order-progress__step' +
            (index <= currentIndex ? ' order-progress__step--done' : '') +
            (index === currentIndex ? ' order-progress__step--current' : '')
          }
        >
          <span className="order-progress__dot" aria-hidden="true" />
          <span>{STATUS_LABEL[step]}</span>
        </li>
      ))}
    </ol>
  )
}
