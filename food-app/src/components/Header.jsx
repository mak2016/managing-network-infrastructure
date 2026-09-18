import { Link } from 'react-router-dom'

export default function Header({ businessName, isOpen, rightSlot }) {
  return (
    <header className="app-header">
      <Link to="/" className="app-header__brand">
        <span className="app-header__name">{businessName}</span>
        {!isOpen && <span className="app-header__closed">Closed</span>}
      </Link>
      <nav className="app-header__nav">
        <Link to="/my-orders">My orders</Link>
        {rightSlot}
      </nav>
    </header>
  )
}
