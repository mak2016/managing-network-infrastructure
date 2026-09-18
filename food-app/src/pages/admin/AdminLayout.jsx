import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AdminLayout() {
  const { user, loading, logout } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="page">Loading…</div>
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <span>Admin</span>
        <nav className="admin-shell__nav">
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/menu">Menu</NavLink>
          <NavLink to="/admin/settings">Settings</NavLink>
        </nav>
        <button type="button" className="admin-shell__logout" onClick={logout}>
          Sign out
        </button>
      </header>
      <main className="admin-shell__body">
        <Outlet />
      </main>
    </div>
  )
}
