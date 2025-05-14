import { Locale, routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import "./globals.css";
import "./fonts/rubik.css";
import "./fonts/cairo.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import LayoutWrapper from "@/components/layouts/LayoutWrapper";

// Load local fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

// Generate localized metadata
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;

  // Validate locale
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const locale = (await params).locale as Locale;

  // Validate locale
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <Toaster />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
