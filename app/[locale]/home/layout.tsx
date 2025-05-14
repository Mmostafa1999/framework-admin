import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = (await params).locale;
  const t = await getTranslations({ locale, namespace: 'Home' });
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  } as Metadata;
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="home-layout">
      {children}
    </section>
  );
} 