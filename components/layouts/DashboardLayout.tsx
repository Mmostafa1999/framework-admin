"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { AlignJustify, Home, Users, Building, Package, FolderKanban } from "lucide-react";
import { Sidebar, NavItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navItems: NavItem[] = [
    { name: t("home"), icon: <Home className="w-5 h-5 text-white" />, route: "/home" },
    { name: t("userManagement"), icon: <Users className="w-5 h-5 text-white" />, route: "/users" },
    { name: t("organizationManagement"), icon: <Building className="w-5 h-5 text-white" />, route: "/organizations" },
    { name: t("frameworkManagement"), icon: <Package className="w-5 h-5 text-white" />, route: "/frameworks" },
    { name: t("projectManagement"), icon: <FolderKanban className="w-5 h-5 text-white" />, route: "/projects" },
  ];

  const isPathActive = (route: string) => pathname.includes(route);

  useEffect(() => {
    const currentItem = navItems.find(item => isPathActive(item.route));
    if (currentItem) {
      document.title = currentItem.name;
    }
  }, [pathname]);

  return (
    <div
      className="flex flex-col min-h-screen bg-gray-50"
      style={{ direction: isRtl ? "rtl" : "ltr", fontFamily: isRtl ? "var(--font-cairo)" : "var(--font-rubik)" }}
    >
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            "md:hidden fixed top-4 z-50 p-2 rounded-lg text-white shadow-lg backdrop-blur-sm",
            isMobileMenuOpen
              ? "bg-white/20"
              : "bg-gradient-to-r from-[var(--primary-blue)] to-[var(--primary-green)]"
          )}
          style={{ [isRtl ? "left" : "right"]: "1rem" }}
        >
          <AlignJustify className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex flex-1">
        <Sidebar
          navigationItems={navItems}
          isPathActive={isPathActive}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <main className="flex-1 transition-all duration-300">{children}</main>
      </div>
    </div>
  );
}
