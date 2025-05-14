import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ 
  params: { locale, frameworkId } 
}: { 
  params: { locale: string; frameworkId: string } 
}) {
  const t = await getTranslations({ locale, namespace: 'Frameworks' });
  return {
    title: `${t('framework')}: ${frameworkId}`,
    description: t('frameworkDetails'),
  } as Metadata;
}

export default function FrameworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="framework-detail-layout">
      {children}
    </section>
  );
} 