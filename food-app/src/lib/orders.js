import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { STATUS } from './status.js'

const ORDERS_COLLECTION = 'orders'

export async function placeOrder({ items, subtotal, deliveryFee, total, fulfillment, customer }) {
  const ref = await addDoc(collection(db, ORDERS_COLLECTION), {
    status: STATUS.PLACED,
    fulfillment,
    items,
    subtotal,
    deliveryFee,
    total,
    customer,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export function subscribeToOrder(orderId, onChange, onError) {
  return onSnapshot(
    doc(db, ORDERS_COLLECTION, orderId),
    (snap) => onChange(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError,
  )
}

export function subscribeToAllOrders(onChange, onError) {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  )
}

export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    status,
    updatedAt: serverTimestamp(),
  })
}
