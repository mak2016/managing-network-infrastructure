import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import SetupNotice from './components/SetupNotice.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { isFirebaseConfigured } from './firebase.js'
import CartPage from './pages/CartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import MyOrdersPage from './pages/MyOrdersPage.jsx'
import OrderTrackingPage from './pages/OrderTrackingPage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import AdminMenuPage from './pages/admin/AdminMenuPage.jsx'
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx'
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx'

export default function App() {
  if (!isFirebaseConfigured) {
    return <SetupNotice />
  }

  return (
    <AuthProvider>
      <CartProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:orderId" element={<OrderTrackingPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />

            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="orders" replace />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="menu" element={<AdminMenuPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  )
}
