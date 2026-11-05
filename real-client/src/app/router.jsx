import {createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout";
import GuestLayout from "../layouts/GuestLayout";
import SeekerLayout from "../layouts/SeekerLayout";
import ProviderLayout from "../layouts/ProviderLayout";
import { rootLoader } from "../loaders/rootLoader";
import { requireRole } from "../guards/requireRole";
import { guestOnlyLoader } from "../guards/guestOnlyLoader";
import { guestRoutes } from "../routes/guestRoutes";
import { seekerRoutes } from "../routes/seekerRoutes";
import { providerRoutes } from "../routes/providerRoutes";

export const router = createBrowserRouter([
    {
        path:"/",
        Component: RootLayout,
        loader: rootLoader,
        children: [
            {
                Component: GuestLayout,
                loader: guestOnlyLoader,
                children: guestRoutes
            }
        ]
    },
    {
        path:"seeker",
        Component: SeekerLayout,
        loader: requireRole("seeker"),
        children: seekerRoutes
    },
    {
        path:"provider",
        Component: ProviderLayout,
        loader: requireRole("provider"),
        children: providerRoutes
    }
])