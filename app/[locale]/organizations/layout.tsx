import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Organizations' });
    return {
        title: t('pageTitle'),
        description: t('pageDescription'),
    } as Metadata;
}

export default function OrganizationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <section className="organizations-layout">
            {children}
        </section>
    );
} 