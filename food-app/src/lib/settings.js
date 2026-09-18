import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

const SETTINGS_DOC = 'settings/general'

export const DEFAULT_SETTINGS = {
  businessName: 'Your Kitchen',
  currency: 'USD',
  deliveryFee: 0,
  minOrder: 0,
  isOpen: true,
  contactPhone: '',
  pickupAddress: '',
}

export function subscribeToSettings(onChange, onError) {
  return onSnapshot(
    doc(db, SETTINGS_DOC),
    (snap) => onChange(snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS),
    onError,
  )
}

export async function saveSettings(patch) {
  await setDoc(doc(db, SETTINGS_DOC), patch, { merge: true })
}
