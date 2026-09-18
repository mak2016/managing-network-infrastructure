import { useMemo, useState } from 'react'
import CartSummaryBar from '../components/CartSummaryBar.jsx'
import CategoryTabs from '../components/CategoryTabs.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Header from '../components/Header.jsx'
import MenuItemCard from '../components/MenuItemCard.jsx'
import { useMenu } from '../hooks/useMenu.js'
import { useSettings } from '../hooks/useSettings.js'

const ALL = 'All'

export default function MenuPage() {
  const { items, loading } = useMenu()
  const { settings } = useSettings()
  const [category, setCategory] = useState(ALL)

  const categories = useMemo(() => {
    const seen = new Set()
    const list = [ALL]
    for (const item of items) {
      if (item.category && !seen.has(item.category)) {
        seen.add(item.category)
        list.push(item.category)
      }
    }
    return list
  }, [items])

  const visibleItems = category === ALL ? items : items.filter((item) => item.category === category)

  return (
    <div className="page page--menu">
      <Header businessName={settings.businessName} isOpen={settings.isOpen} />

      {!settings.isOpen && (
        <p className="banner banner--warn">
          We're currently closed. You can browse the menu, but ordering is paused.
        </p>
      )}

      <CategoryTabs categories={categories} active={category} onSelect={setCategory} />

      <div className="menu-list">
        {loading && <EmptyState title="Loading menu…" />}
        {!loading && visibleItems.length === 0 && (
          <EmptyState title="No items yet" hint="Check back soon." />
        )}
        {visibleItems.map((item) => (
          <MenuItemCard key={item.id} item={item} currency={settings.currency} />
        ))}
      </div>

      <CartSummaryBar currency={settings.currency} />
    </div>
  )
}
