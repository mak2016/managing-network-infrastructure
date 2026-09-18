export default function CategoryTabs({ categories, active, onSelect }) {
  if (categories.length <= 1) return null

  return (
    <div className="category-tabs">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={'category-tabs__btn' + (category === active ? ' category-tabs__btn--active' : '')}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
