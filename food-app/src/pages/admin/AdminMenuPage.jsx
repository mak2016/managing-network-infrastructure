import { useState } from 'react'
import EmptyState from '../../components/EmptyState.jsx'
import { useMenu } from '../../hooks/useMenu.js'
import { useSettings } from '../../hooks/useSettings.js'
import { formatMoney } from '../../lib/format.js'
import { createMenuItem, deleteMenuItem, updateMenuItem } from '../../lib/menu.js'
import AdminMenuItemEditor from './AdminMenuItemEditor.jsx'

export default function AdminMenuPage() {
  const { items, loading } = useMenu()
  const { settings } = useSettings()
  const [editingId, setEditingId] = useState(null) // 'new' | item id | null

  async function handleSave(values) {
    if (editingId === 'new') {
      await createMenuItem({ ...values, sortOrder: items.length })
    } else {
      await updateMenuItem(editingId, values)
    }
    setEditingId(null)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this menu item?')) return
    await deleteMenuItem(id)
  }

  const editingItem = editingId && editingId !== 'new' ? items.find((i) => i.id === editingId) : null

  return (
    <div>
      <div className="admin-page__toolbar">
        <h1>Menu</h1>
        {editingId === null && (
          <button type="button" className="primary-btn" onClick={() => setEditingId('new')}>
            Add item
          </button>
        )}
      </div>

      {editingId !== null && (
        <AdminMenuItemEditor
          item={editingItem}
          onSave={handleSave}
          onCancel={() => setEditingId(null)}
        />
      )}

      {loading && <EmptyState title="Loading menu…" />}
      {!loading && items.length === 0 && editingId === null && (
        <EmptyState title="No menu items yet" hint="Add your first item to get started." />
      )}

      <div className="admin-menu-list">
        {items.map((item) => (
          <div key={item.id} className="admin-menu-row">
            <div>
              <p className="admin-menu-row__name">
                {item.name}
                {item.available === false && <span className="menu-item__sold-out"> · Sold out</span>}
              </p>
              <p className="admin-order-card__meta">
                {item.category} · {formatMoney(item.price, settings.currency)}
              </p>
            </div>
            <div className="admin-order-card__actions">
              <button
                type="button"
                onClick={() => updateMenuItem(item.id, { available: item.available === false })}
              >
                {item.available === false ? 'Mark available' : 'Mark sold out'}
              </button>
              <button type="button" onClick={() => setEditingId(item.id)}>
                Edit
              </button>
              <button type="button" className="admin-order-card__cancel" onClick={() => handleDelete(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
