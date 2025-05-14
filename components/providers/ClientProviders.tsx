"use client";

import { NextIntlClientProvider } from "next-intl";
import { Locale } from "@/i18n/routing";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";

export default function ClientProviders({
    children,
    messages,
    locale,
}: {
    children: React.ReactNode;
    messages: any;
    locale: Locale;
}) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider>
                    {children}
                    <Toaster />
            </AuthProvider>
        </NextIntlClientProvider>
    );
}