import { House, UserRound } from "lucide-react";
import Home from "../pages/Home";
import Profile from "../pages/Profile";

export const seekerRoutes = [
            {
                index: true, 
                Component: Home,
                nav: {
                    label: "Home",
                    to: "/seeker",
                    icon: House,
                    type: "primary", 
                },
            },
            {
                path:"profile", 
                Component: Profile,
                nav: {
                    label: "Profile",
                    to: "/seeker/profile",
                    icon: UserRound,
                    type: "secondary"
                }
            }
        ]