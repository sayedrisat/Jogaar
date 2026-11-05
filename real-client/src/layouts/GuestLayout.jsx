
import { Outlet, useLocation } from 'react-router'
import BottomPillNav from '../shared/components/BottomPillNav'
import FloatingBrand from '../shared/components/FloatingBrand'
import Home from '../pages/Home'

const GuestLayout = () => {
  const location = useLocation()
  return (
    <div className="app-shell">
      <FloatingBrand />
      <main className="app-main">
        {/* Login and Join keep their existing URLs while opening over Home. */}
        {['/login', '/join'].includes(location.pathname) && <Home />}
        <Outlet />
      </main>
      <BottomPillNav />
    </div>
  )
}

export default GuestLayout
