"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DashboardCardProps {
    title: string;
    value: string;
    icon?: ReactNode;
    color?: "blue" | "green" | "purple" | "orange" | "default";
    footer?: ReactNode;
    className?: string;
    aosAnimation?: string;
    "aosAnimation-delay"?: string;
}

export function DashboardCard({
    title,
    value,
    icon,
    color = "default",
    footer,
    className,
    aosAnimation = "fade-up",
    "aosAnimation-delay": aosAnimationDelay
}: DashboardCardProps) {
    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    // Generate background color based on color prop
    const getBackgroundColor = () => {
        switch (color) {
            case "blue":
                return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200";
            case "green":
                return "bg-gradient-to-br from-green-50 to-green-100 border-green-200";
            case "purple":
                return "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200";
            case "orange":
                return "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200";
            default:
                return "bg-gradient-to-br from-gray-50 to-white border-gray-200";
        }
    };

    // Generate value color based on color prop
    const getValueColor = () => {
        switch (color) {
            case "blue":
                return "text-blue-700";
            case "green":
                return "text-green-700";
            case "purple":
                return "text-purple-700";
            case "orange":
                return "text-orange-700";
            default:
                return "text-gray-700";
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="h-full"
            data-aos={aosAnimation}
            data-aos-once="false"
            data-aos-delay={aosAnimationDelay}
        >
            <Card className={cn(
                "h-full overflow-hidden border shadow-sm hover:shadow-md transition-all",
                getBackgroundColor(),
                className
            )}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
                    {icon && <div className="p-2 rounded-full bg-white/80 shadow-sm">{icon}</div>}
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold mb-4 tracking-tight">
                        <span className={getValueColor()}>{value}</span>
                    </div>
                    {footer && (
                        <div className="text-xs text-gray-600 mt-2">
                            {footer}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
} 