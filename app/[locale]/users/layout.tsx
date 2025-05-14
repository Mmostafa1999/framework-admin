import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Users' });
    return {
        title: t('pageTitle'),
        description: t('pageDescription'),
    } as Metadata;
}

export default function UsersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <section className="users-layout">
            {children}
        </section>
    );
} 