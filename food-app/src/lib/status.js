// Order lifecycle. Delivery orders pass through OUT_FOR_DELIVERY; pickup
// orders skip straight from READY to COMPLETED.
export const STATUS = {
  PLACED: 'placed',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const STATUS_LABEL = {
  [STATUS.PLACED]: 'Order received',
  [STATUS.PREPARING]: 'Preparing',
  [STATUS.READY]: 'Ready for pickup',
  [STATUS.OUT_FOR_DELIVERY]: 'Out for delivery',
  [STATUS.COMPLETED]: 'Completed',
  [STATUS.CANCELLED]: 'Cancelled',
}

// The sequence a given order is expected to move through, used to render
// progress steps and to compute "what's the next status" in the admin view.
export function statusSequence(fulfillment) {
  if (fulfillment === 'delivery') {
    return [STATUS.PLACED, STATUS.PREPARING, STATUS.OUT_FOR_DELIVERY, STATUS.COMPLETED]
  }
  return [STATUS.PLACED, STATUS.PREPARING, STATUS.READY, STATUS.COMPLETED]
}

export function nextStatus(fulfillment, currentStatus) {
  const sequence = statusSequence(fulfillment)
  const index = sequence.indexOf(currentStatus)
  if (index === -1 || index === sequence.length - 1) return null
  return sequence[index + 1]
}
