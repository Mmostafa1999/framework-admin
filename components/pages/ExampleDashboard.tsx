"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusIcon, UserIcon, FolderIcon, HomeIcon, SettingsIcon } from 'lucide-react';

export default function ExampleDashboard() {
    const t = useTranslations('AdminDashboard');

    return (
        <div className="container mx-auto p-6">
            {/* Header section with tour data attribute */}
            <div className="flex justify-between items-center mb-8" data-tour="dashboard">
                <div>
                    <h1 className="text-3xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>


            </div>

            {/* User Management section with tour data attribute */}
            <section className="mb-8" data-tour="userManagement">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">{t('userManagement')}</h2>
                        <UserIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Manage users, roles, and permissions</p>
                    <Button className="mt-4" variant="outline">{t('manageUsers')}</Button>
                </Card>
            </section>

            {/* Projects section with tour data attribute */}
            <section className="mb-8" data-tour="projectsView">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">{t('projectOverview')}</h2>
                        <FolderIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">View and manage your projects</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-background p-4 rounded-md">
                            <p className="text-muted-foreground">Active</p>
                            <p className="text-2xl font-bold">24</p>
                        </div>
                        <div className="bg-background p-4 rounded-md">
                            <p className="text-muted-foreground">Completed</p>
                            <p className="text-2xl font-bold">18</p>
                        </div>
                        <div className="bg-background p-4 rounded-md">
                            <p className="text-muted-foreground">On Hold</p>
                            <p className="text-2xl font-bold">3</p>
                        </div>
                        <div className="bg-background p-4 rounded-md">
                            <p className="text-muted-foreground">Cancelled</p>
                            <p className="text-2xl font-bold">2</p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Add Button with tour data attribute */}
            <div className="fixed bottom-6 right-6" data-tour="addButton">
                <Button className="rounded-full w-14 h-14 shadow-lg">
                    <PlusIcon className="w-6 h-6" />
                </Button>
            </div>

            {/* Profile section with tour data attribute */}
            <div className="fixed top-6 right-6" data-tour="profileSection">
                <Button variant="ghost" className="rounded-full w-10 h-10 p-0">
                    <SettingsIcon className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
} 