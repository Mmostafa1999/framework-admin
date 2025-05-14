"use client";

import { DashboardCard } from "@/components/ui/dashboard-card";
import { useUserStats } from "@/hooks/useUserStats";
import { useTranslations } from "next-intl";
import { Users, UserCheck, UserX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useDashboardStats } from "@/context/DashboardStatsContext";

export interface UserStatsCardProps {
    onRefreshed?: () => void;
}

export function UserStatsCard({ onRefreshed }: UserStatsCardProps) {
    const t = useTranslations("AdminDashboard");
    const { totalUsers, activeUsers, inactiveUsers, isLoading, error, refreshStats, lastUpdated } = useUserStats();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { notifyRefresh, subscribeToRefresh } = useDashboardStats();

    // Subscribe to dashboard-wide refresh events
    useEffect(() => {
        // Create the listener function
        const handleDashboardRefresh = () => {
            if (!isRefreshing) {
                handleRefresh();
            }
        };

        // Subscribe to refresh events
        const unsubscribe = subscribeToRefresh(handleDashboardRefresh);

        // Cleanup on unmount
        return () => {
            unsubscribe();
        };
    }, [subscribeToRefresh, isRefreshing]);

    // Format numbers with commas
    const formatNumber = (num: number) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshStats();
        setIsRefreshing(false);

        // Notify the dashboard context that user data has been refreshed
        notifyRefresh('users');

        if (onRefreshed) {
            onRefreshed();
        }
    };

    // Format the last updated time
    const getLastUpdatedText = () => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) {
            return t("justNow");
        } else if (diffInMinutes === 1) {
            return t("aMinuteAgo");
        } else if (diffInMinutes < 60) {
            return t("minutesAgo", { minutes: diffInMinutes });
        } else {
            const hours = Math.floor(diffInMinutes / 60);
            if (hours === 1) {
                return t("anHourAgo");
            } else if (hours < 24) {
                return t("hoursAgo", { hours });
            } else {
                return t("daysAgo", { days: Math.floor(hours / 24) });
            }
        }
    };

    return (
        <div className="relative">
            {/* Refresh button overlay */}
            <div className="absolute top-3 right-3 z-10">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full bg-white/50 hover:bg-white/80 shadow-sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing || isLoading}
                            >
                                <RefreshCw
                                    className={`h-4 w-4 text-gray-600 ${isRefreshing ? "animate-spin" : ""}`}
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isRefreshing ? t("refreshing") : t("refreshData")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Card with loading state */}
            <DashboardCard
                title={t("usersCount")}
                value={isLoading ? "..." : formatNumber(totalUsers)}
                icon={<Users className="h-5 w-5 text-blue-600" />}
                color="blue"
                aosAnimation="fade-up"
                footer={
                    <div>
                        <div className="flex justify-between w-full mb-1">
                            <div className="flex items-center">
                                <UserCheck className="h-4 w-4 mr-1 text-green-600" />
                                <span>{isLoading ? "..." : formatNumber(activeUsers)} {t("active")}</span>
                            </div>
                            <div className="flex items-center">
                                <UserX className="h-4 w-4 mr-1 text-red-600" />
                                <span>{isLoading ? "..." : formatNumber(inactiveUsers)} {t("inactive")}</span>
                            </div>
                        </div>

                        {/* Last updated text */}
                        {!isLoading && !error && (
                            <div className="text-xxs text-gray-500 mt-2 text-right">
                                {t("lastUpdated")}: {getLastUpdatedText()}
                            </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="text-xxs text-red-500 mt-2">
                                {t("errorFetchingData")}
                            </div>
                        )}
                    </div>
                }
            />
        </div>
    );
} 