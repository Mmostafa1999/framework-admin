import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Projects' });
    return {
        title: t('pageTitle'),
        description: t('pageDescription'),
    } as Metadata;
}

export default function ProjectsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <section className="projects-layout">
            {children}
        </section>
    );
} 