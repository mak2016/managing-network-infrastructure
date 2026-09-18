import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const MENU_COLLECTION = 'menuItems'

export function subscribeToMenu(onChange, onError) {
  const q = query(collection(db, MENU_COLLECTION), orderBy('sortOrder', 'asc'))
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  )
}

export async function createMenuItem(item) {
  await addDoc(collection(db, MENU_COLLECTION), item)
}

export async function updateMenuItem(id, patch) {
  await updateDoc(doc(db, MENU_COLLECTION, id), patch)
}

export async function deleteMenuItem(id) {
  await deleteDoc(doc(db, MENU_COLLECTION, id))
}
