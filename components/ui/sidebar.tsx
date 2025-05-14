"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { ChevronLeft, ChevronRight, LogOut, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

// Types for sidebar items
export interface NavItem {
    name: string;
    icon: React.ReactNode;
    route: string;
}

interface SidebarProps {
    navigationItems: NavItem[];
    isPathActive: (path: string) => boolean;
    title?: string;
    showModuleSelection?: boolean;
    onModuleSelection?: () => void;
    isMobileMenuOpen?: boolean;
    setIsMobileMenuOpen?: (value: boolean) => void;
}

export function Sidebar({
    navigationItems,
    isPathActive,
    title,
    showModuleSelection = false,
    onModuleSelection,
    isMobileMenuOpen = false,
    setIsMobileMenuOpen
}: SidebarProps) {
    const t = useTranslations("Sidebar");
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const { user, logout, isLoading } = useAuthContext();
    const { toast } = useToast();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check for mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) setIsCollapsed(true);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Styling constants
    const sidebarBackground = "bg-gradient-to-b from-[var(--primary-blue)] to-[var(--primary-green)]";
    const activeTabBg = 'bg-white/25';
    const activeIndicatorColor = 'bg-white';
    const hoverBg = 'hover:bg-white/15';

    // Handle logout
    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Handle link click on mobile to close menu
    const handleMobileLinkClick = () => {
        if (isMobile && setIsMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <div className="relative">
            <motion.div
                initial={{ width: isMobile ? '0px' : '280px', x: isMobile ? '-100%' : 0 }}
                animate={{
                    width: isMobile
                        ? (isMobileMenuOpen ? '280px' : '0px')
                        : (isCollapsed ? '80px' : '280px'),
                    x: isMobile && !isMobileMenuOpen ? '-100%' : 0
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                    "h-screen text-white flex flex-col justify-between sticky top-0 z-50",
                    sidebarBackground
                )}
            >
                {/* Top Section with User Profile */}
                <div>
                    {/* User Profile */}
                    <div className={cn(
                        "pt-6 pb-4 px-4",
                        isLoading && "animate-pulse"
                    )}>
                        <div className={cn(
                            "flex items-center gap-4 mb-4",
                            isCollapsed ? "justify-center" : "justify-start"
                        )}>
                            <div className={cn(
                                "relative group",
                                isCollapsed && "mx-auto"
                            )}>
                                {isLoading ? (
                                    <div className="w-10 h-10 rounded-full bg-blue-300/50"></div>
                                ) : (
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full transition-all" />
                                )}
                            </div>

                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: isCollapsed ? 0 : 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-1 overflow-hidden"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="h-5 bg-blue-300/50 rounded w-2/3 mb-2"></div>
                                            <div className="h-4 bg-blue-300/30 rounded w-3/4"></div>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="font-bold text-lg truncate">
                                                {user?.name || 'User'}
                                            </h3>
                                            <p className="text-white/70 text-sm truncate">
                                                {user?.email || ''}
                                            </p>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className={cn(
                        "h-px bg-white/20 mx-auto my-2",
                        isCollapsed ? "w-8" : "w-full"
                    )} />

                    {/* Navigation Items */}
                    <nav className="p-3 gap-y-4 mt-4">
                        {navigationItems.map((item, index) => (
                            <Link href={item.route} key={index} onClick={handleMobileLinkClick}>
                                <motion.div
                                    data-tour={`nav-${item.route.replace(/\//g, '-')}`}
                                    className={cn(
                                        "w-full flex items-center rounded-lg transition-colors relative",
                                        isPathActive(item.route)
                                            ? activeTabBg
                                            : hoverBg,
                                        isCollapsed
                                            ? "justify-center py-3 px-2"
                                            : "px-4 py-3"
                                    )}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-7 h-7",
                                        !isCollapsed && isRtl ? "ml-3" : !isCollapsed ? "mr-3" : ""
                                    )}>
                                        {item.icon}
                                    </div>

                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 1 }}
                                            animate={{ opacity: isCollapsed ? 0 : 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="whitespace-nowrap font-medium text-left"
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}

                                    {isPathActive(item.route) && !isCollapsed && (
                                        <motion.div
                                            className={cn(
                                                "absolute rounded-sm w-1 h-full",
                                                isRtl ? "left-0" : "right-0",
                                                activeIndicatorColor
                                            )}
                                            layoutId="activeTab"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="p-3 mt-auto border-t border-white/20 space-y-2">
                    {/* Module Selection Button - if enabled */}
                    {showModuleSelection && (
                        <motion.button
                            onClick={onModuleSelection}
                            className={cn(
                                "w-full flex items-center rounded-xl transition-all relative overflow-hidden mb-2",
                                isCollapsed ? "justify-center py-4 px-2" : "px-5 py-4",
                                "bg-gradient-to-r from-[var(--ref-teal-dark)] to-teal-600 hover:from-[var(--ref-teal-light)] hover:to-teal-500"
                            )}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 bg-white transform translate-x-1/3 -translate-y-1/3"></div>
                            <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full opacity-10 bg-white transform -translate-x-1/3 translate-y-1/3"></div>

                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: isCollapsed ? 0 : 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="whitespace-nowrap font-medium text-white text-left"
                                >
                                    {t("moduleSelection")}
                                </motion.span>
                            )}

                            {!isCollapsed && (
                                <ChevronRight className="w-4 h-4 text-white/80 ml-1" />
                            )}
                        </motion.button>
                    )}

                   

                    {/* Logout Button */}
                    <motion.button
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center rounded-lg transition-colors",
                            hoverBg,
                            isCollapsed
                                ? "justify-center py-3 px-2"
                                : "px-4 py-3"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className={cn(
                            "flex items-center justify-center w-7 h-7",
                            !isCollapsed && isRtl ? "ml-3" : !isCollapsed ? "mr-3" : ""
                        )}>
                            <LogOut className="w-5 h-5 text-white" />
                        </div>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 1 }}
                                animate={{ opacity: isCollapsed ? 0 : 1 }}
                                transition={{ duration: 0.2 }}
                                className="whitespace-nowrap font-medium text-left"
                            >
                                {t('logout')}
                            </motion.span>
                        )}
                    </motion.button>

                    {/* Language Switcher */}
                    <div className={cn(
                        isCollapsed ? "flex justify-center" : "px-2",
                        "mt-2 mb-2"
                    )}>
                        <LanguageSwitcher isCollapsed={isCollapsed} />
                    </div>

                    {/* Collapse Button - Only show on desktop */}
                    {!isMobile && (
                        <motion.button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={cn(
                                "w-full flex items-center justify-center p-2 rounded-lg mt-2",
                                hoverBg
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="w-5 h-5" />
                            ) : (
                                isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
                            )}
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}