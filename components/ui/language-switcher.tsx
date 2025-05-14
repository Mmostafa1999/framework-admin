"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "@/i18n/routing";

export function LanguageSwitcher({
    className,
    isCollapsed = false,
}: {
    className?: string;
    isCollapsed?: boolean;
}) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLanguage = () => {
        // Toggle between English and Arabic
        const newLocale = locale === "en" ? "ar" : "en";

        // Navigate to the current path with the new locale
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <Button
            variant="ghost"
            onClick={toggleLanguage}
            data-tour="language-switcher"
            className={cn(
                "language-switcher flex items-center justify-center rounded-lg transition-colors hover:bg-white/20",
                isCollapsed ? "w-10 h-10 p-0" : "px-4 py-2 w-auto",
                className
            )}
            title={locale === "en" ? "Switch to Arabic" : "Switch to English"}
        >
            <Globe className="h-5 w-5" />
            {!isCollapsed && (
                <span className="ml-2">{locale === "en" ? "AR" : "EN"}</span>
            )}
        </Button>
    );
}
