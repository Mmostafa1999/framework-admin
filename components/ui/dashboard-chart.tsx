"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import {
    PieChart,
    Pie,
    ResponsiveContainer,
    Cell,
    Legend,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";
import React from 'react';

interface ChartData {
    name: string;
    value: number;
    color?: string;
}

interface DashboardChartProps {
    title: string;
    description?: string;
    data: ChartData[];
    chartType: "pie" | "bar";
    className?: string;
    colorScheme?: "blue" | "green" | "purple" | "orange" | "default";
    aosAnimation?: string;
}

export function DashboardChart({
    title,
    description,
    data,
    chartType = "pie",
    className,
    colorScheme = "default",
    aosAnimation = "fade-up"
}: DashboardChartProps) {
    const locale = useLocale();
    const isRtl = locale === "ar";

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    // Generate colors based on scheme
    const getColorScheme = () => {
        switch (colorScheme) {
            case "blue":
                return ["#0c4a6e", "#0369a1", "#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc"];
            case "green":
                return ["#14532d", "#166534", "#15803d", "#16a34a", "#22c55e", "#4ade80"];
            case "purple":
                return ["#4c1d95", "#5b21b6", "#6d28d9", "#7c3aed", "#8b5cf6", "#a78bfa"];
            case "orange":
                return ["#7c2d12", "#9a3412", "#c2410c", "#ea580c", "#f97316", "#fb923c"];
            default:
                return ["#0369a1", "#0284c7", "#0ea5e9", "#4ade80", "#6d28d9", "#f97316"];
        }
    };

    const colors = getColorScheme();

    // Use custom colors from data if provided, otherwise use color scheme
    const getDataColors = (index: number) => {
        return data[index]?.color || colors[index % colors.length];
    };

    const renderPieChart = () => {
        return (
            <div style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getDataColors(index)} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}`, ""]} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const renderBarChart = () => {
        return (
            <div style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout={isRtl ? "vertical" : "horizontal"}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        {isRtl ? (
                            <>
                                <YAxis dataKey="name" type="category" />
                                <XAxis type="number" />
                            </>
                        ) : (
                            <>
                                <XAxis dataKey="name" />
                                <YAxis />
                            </>
                        )}
                        <Tooltip formatter={(value) => [`${value}`, ""]} />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getDataColors(index)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="h-full"
            data-aos={aosAnimation}
            data-aos-once="false"
        >
            <Card className={cn("h-full overflow-hidden", className)}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </CardHeader>
                <CardContent className="pb-2">
                    <div className="h-[300px]">
                        {chartType === "pie" ? renderPieChart() : renderBarChart()}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}