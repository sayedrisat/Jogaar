import { LayoutDashboard, UserRound } from "lucide-react";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";

export const providerRoutes = [
  {
    path: "dashboard",
    Component: Dashboard,
    nav: {
      label: "Dashboard",
      to: "/provider/dashboard",
      icon: LayoutDashboard,
      type: "primary",
    },
  },
  {
    path: "profile",
    Component: Profile,
    nav: {
      label: "Profile",
      to: "/provider/profile",
      icon: UserRound,
      type: "secondary",
    },
  },
];