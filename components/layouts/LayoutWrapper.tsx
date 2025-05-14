"use client";

import { usePathname } from "@/i18n/routing";
import SharedLayout from "@/components/layouts/SharedLayout";

const PUBLIC_ROUTES = ["/login"];

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Check if the current path is a public route
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.includes(route));

    if (isPublicRoute) {
        // Use a simple wrapper for public routes
        return <div className="flex-1">{children}</div>;
    }

    // Use SharedLayout for authenticated routes
    return <SharedLayout>{children}</SharedLayout>;
} 