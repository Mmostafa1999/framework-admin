"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardChart } from "@/components/ui/dashboard-chart";
import { Layers, FolderKanban, ArrowRight } from "lucide-react";
import { UserStatsCard } from "@/components/ui/users/UserStatsCard";
import { DashboardStatsProvider } from "@/context/DashboardStatsContext";
import Link from "next/link";

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 },
    },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

// Static data for charts - will be replaced with dynamic data later
const frameworkStatusData = [
    { name: "Active", value: 42, color: "#16a34a" },
    { name: "Inactive", value: 12, color: "#dc2626" }
];

const projectStatusData = [
    { name: "Active", value: 35, color: "#16a34a" },
    { name: "On Hold", value: 15, color: "#f59e0b" },
    { name: "Closed", value: 8, color: "#dc2626" }
];

export function AdminDashboard() {
    const t = useTranslations("AdminDashboard");
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const fontFamily = isRtl ? 'var(--font-cairo)' : 'var(--font-rubik)';

    return (
        <DashboardStatsProvider>
            <div className="min-h-screen bg-gray-50" style={{ fontFamily, direction: isRtl ? 'rtl' : 'ltr' }}>
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 text-white" data-tour="dashboard-hero">
                    {/* Glowing decorative background */}
                    <motion.div
                        className="absolute inset-0 overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                    </motion.div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
                        <motion.div
                            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={fadeIn}>
                                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                                    {t("title")}
                                </h1>

                                <p className="text-xl text-white/90 mb-8 max-w-xl">
                                    {t("subtitle")}
                                </p>

                                <motion.div
                                    className="flex flex-wrap gap-4"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                    data-tour="dashboard-actions"
                                >
                                    <Link href={`/${locale}/users`}>
                                        <motion.button
                                            className="px-6 py-3 bg-white text-blue-700 rounded-lg font-medium inline-flex items-center shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                                            whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {t("manageUsers")}
                                            <ArrowRight className={`h-4 w-4 ${isRtl ? 'mr-2' : 'ml-2'}`} />
                                        </motion.button>
                                    </Link>
                                    <Link href={`/${locale}/frameworks`}>
                                        <motion.button
                                            className="px-6 py-3 bg-blue-800 text-white rounded-lg font-medium inline-flex items-center shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                                            whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {t("manageFrameworks")}
                                            <ArrowRight className={`h-4 w-4 ${isRtl ? 'mr-2' : 'ml-2'}`} />
                                        </motion.button>
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Dashboard Summary Cards */}
                <motion.div
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        data-tour="dashboard-summary"
                    >
                        {/* Dynamic User Stats Card */}
                        <motion.div
                            variants={fadeIn}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                            <UserStatsCard />
                        </motion.div>

                        <motion.div
                            variants={fadeIn}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                            <DashboardCard
                                title={t("frameworkCount")}
                                value="54"
                                icon={<Layers className="h-5 w-5 text-green-600" />}
                                color="green"
                                aosAnimation="fade-up"
                                aosAnimation-delay="100"
                                footer={
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                                        <span>42 {t("active")}</span>
                                        <div className="w-3 h-3 rounded-full bg-red-500 mx-1 ml-3"></div>
                                        <span>12 {t("inactive")}</span>
                                    </div>
                                }
                            />
                        </motion.div>

                        <motion.div
                            variants={fadeIn}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                            <DashboardCard
                                title={t("projectCount")}
                                value="58"
                                icon={<FolderKanban className="h-5 w-5 text-purple-600" />}
                                color="purple"
                                aosAnimation="fade-up"
                                aosAnimation-delay="200"
                                footer={
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                                        <span>35 {t("active")}</span>
                                        <div className="w-3 h-3 rounded-full bg-amber-500 mx-1 ml-2"></div>
                                        <span>15 {t("onHold")}</span>
                                        <div className="w-3 h-3 rounded-full bg-red-500 mx-1 ml-2"></div>
                                        <span>8 {t("closed")}</span>
                                    </div>
                                }
                            />
                        </motion.div>
                    </motion.div>

                    {/* Charts Section */}
                    <motion.div
                        className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.4 }}
                        data-tour="dashboard-charts"
                    >
                        <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                            <DashboardChart
                                title={t("frameworkStats")}
                                description={t("frameworkStatusDescription")}
                                data={frameworkStatusData}
                                chartType="pie"
                                colorScheme="green"
                                aosAnimation="fade-up"
                            />
                        </motion.div>

                        <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                            <DashboardChart
                                title={t("projectOverview")}
                                description={t("projectStatusDescription")}
                                data={projectStatusData}
                                chartType="pie"
                                colorScheme="purple"
                                aosAnimation="fade-up"
                                aosAnimation-delay="100"
                            />
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </DashboardStatsProvider>
    );
}