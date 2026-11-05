import { House, LogIn, UserPlus } from "lucide-react";
import Home from "../pages/Home";
import Join from "../pages/Join";
import Login from "../pages/Login";

export const guestRoutes = [
  {
    index: true,
    Component: Home,
    nav: {
      label: "Home",
      to: "/",
      icon: House,
      type: "primary",
    },
  },
  {
    path: "/login",
    Component: Login,
    nav: {
      label: "Sign in",
      to: "/login",
      icon: LogIn,
      type: "primary",
    },
  },
  {
    path: "/join",
    Component: Join,
    nav: {
      label: "Join",
      to: "/join",
      icon: UserPlus,
      type: "primary",
    },
  },
];