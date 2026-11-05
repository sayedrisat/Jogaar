import { Outlet } from "react-router";
import BottomPillNav from "../shared/components/BottomPillNav";
import FloatingBrand from "../shared/components/FloatingBrand";

const SeekerLayout = () => {
  return (
    <div className="app-shell">
      <FloatingBrand to="/seeker" />
      <main className="app-main"><Outlet /></main>
      <BottomPillNav />
    </div>
  );
};

export default SeekerLayout;
