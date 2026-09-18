import { useEffect, useState } from 'react'
import { useSettings } from '../../hooks/useSettings.js'
import { saveSettings } from '../../lib/settings.js'

export default function AdminSettingsPage() {
  const { settings, loading } = useSettings()
  const [values, setValues] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading) setValues(settings)
    // Only sync from Firestore once loaded, so we don't clobber in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await saveSettings({
        ...values,
        deliveryFee: Number(values.deliveryFee) || 0,
        minOrder: Number(values.minOrder) || 0,
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <h1>Store settings</h1>
      <form className="checkout-form" onSubmit={handleSubmit}>
        <label className="admin-page__toggle">
          <input
            type="checkbox"
            checked={values.isOpen}
            onChange={(e) => set('isOpen', e.target.checked)}
          />
          Open for orders
        </label>

        <label className="field">
          <span>Business name</span>
          <input value={values.businessName} onChange={(e) => set('businessName', e.target.value)} />
        </label>

        <label className="field">
          <span>Currency code</span>
          <input
            value={values.currency}
            onChange={(e) => set('currency', e.target.value.toUpperCase())}
            placeholder="USD"
            maxLength={3}
          />
        </label>

        <label className="field">
          <span>Delivery fee</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.deliveryFee}
            onChange={(e) => set('deliveryFee', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Minimum order</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.minOrder}
            onChange={(e) => set('minOrder', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Contact phone</span>
          <input value={values.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
        </label>

        <label className="field">
          <span>Pickup address</span>
          <textarea value={values.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)} />
        </label>

        <button type="submit" className="primary-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <p className="banner banner--good">Saved.</p>}
      </form>
    </div>
  )
}
