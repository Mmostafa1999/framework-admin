"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";

// This shared layout component can be used for authenticated pages
// It wraps DashboardLayout and can add additional context or providers if needed
export default function SharedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
            <DashboardLayout>
                {children}
            </DashboardLayout>
    );
}