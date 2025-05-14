import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Frameworks' });
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  } as Metadata;
}

export default function FrameworksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="frameworks-layout">
      {children}
    </section>
  );
} 