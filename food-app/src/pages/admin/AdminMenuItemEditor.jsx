import { useState } from 'react'

const BLANK = { name: '', description: '', price: '', category: '', imageUrl: '', available: true }

export default function AdminMenuItemEditor({ item, onSave, onCancel }) {
  const [values, setValues] = useState(() => (item ? { ...BLANK, ...item } : BLANK))
  const [saving, setSaving] = useState(false)

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await onSave({
        name: values.name.trim(),
        description: values.description.trim(),
        price: Number(values.price) || 0,
        category: values.category.trim() || 'Menu',
        imageUrl: values.imageUrl.trim(),
        available: values.available,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="checkout-form admin-menu-editor" onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input value={values.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea value={values.description} onChange={(e) => set('description', e.target.value)} />
      </label>
      <label className="field">
        <span>Price</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={values.price}
          onChange={(e) => set('price', e.target.value)}
          required
        />
      </label>
      <label className="field">
        <span>Category</span>
        <input
          value={values.category}
          onChange={(e) => set('category', e.target.value)}
          placeholder="e.g. Mains, Drinks"
        />
      </label>
      <label className="field">
        <span>Image URL (optional)</span>
        <input value={values.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
      </label>
      <label className="admin-page__toggle">
        <input
          type="checkbox"
          checked={values.available}
          onChange={(e) => set('available', e.target.checked)}
        />
        Available
      </label>

      <div className="admin-order-card__actions">
        <button type="submit" className="primary-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  )
}
