import { Outlet } from 'react-router'
import BottomPillNav from '../shared/components/BottomPillNav'
import FloatingBrand from '../shared/components/FloatingBrand'

const ProviderLayout = () => {
  return (
    <div className="app-shell">
      <FloatingBrand to="/provider/dashboard" />
      <main className="app-main"><Outlet /></main>
      <BottomPillNav />
    </div>
  )
}

export default ProviderLayout
