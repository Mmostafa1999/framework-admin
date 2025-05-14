"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Specification, CapabilityLevel } from "@/hooks/useSpecifications";
import { RefreshCw, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

interface SpecificationTableProps {
    specifications: Specification[];
    isLoading: boolean;
    isRtl: boolean;
    refreshing: string | null;
    onViewSpecification: (spec: Specification) => void;
    onEditSpecification: (spec: Specification) => void;
    onDeleteSpecification: (specId: string) => void;
}

// Empty state component
export const EmptyState = ({ onAddSpecification }: { onAddSpecification: () => void }) => {
    const t = useTranslations("SpecificationManagement");

    return (
        <div className="text-center py-10">
            <div className="mb-4 mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noSpecificationsYet")}</h3>
            <p className="text-gray-500 mb-4">{t("createFirstSpecification")}</p>
            <Button onClick={onAddSpecification} className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)]">
                {t("addSpecification")}
            </Button>
        </div>
    );
};

// Loading skeleton
export const TableSkeleton = () => (
    <div className="divide-y animate-pulse">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 px-6 py-4 items-center">
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2 hidden sm:block"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 hidden md:block"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2 hidden md:block"></div>
                <div className="h-5 bg-gray-200 rounded w-2/3 hidden lg:block"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
            </div>
        ))}
    </div>
);

// Get level color based on capability level
const getLevelColor = (level: CapabilityLevel): string => {
    switch (level) {
        case "foundational": return "bg-blue-100 text-blue-800";
        case "advanced": return "bg-green-100 text-green-800";
        case "veryAdvanced": return "bg-orange-100 text-orange-800";
        default: return "bg-gray-100 text-gray-800";
    }
};

// Get localized level name
const getLocalizedLevelName = (level: CapabilityLevel, isRtl: boolean): string => {
    switch (level) {
        case "foundational": return isRtl ? "اساسيه" : "Foundational";
        case "advanced": return isRtl ? "متقدمه" : "Advanced";
        case "veryAdvanced": return isRtl ? "متقدمه جدا" : "Very Advanced";
        default: return isRtl ? "اساسيه" : "Foundational";
    }
};

export function SpecificationTable({
    specifications,
    isLoading,
    isRtl,
    refreshing,
    onViewSpecification,
    onEditSpecification,
    onDeleteSpecification
}: SpecificationTableProps) {
    const t = useTranslations("SpecificationTable");
    const levelT = useTranslations("SpecificationManagement");
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleDropdown = (specId: string) => {
        setActiveDropdown(activeDropdown === specId ? null : specId);
    };

    // Get latest version from version history
    const getLatestVersion = (spec: Specification): string => {
        if (!spec.versionHistory || spec.versionHistory.length === 0) return "-";
        return spec.versionHistory[spec.versionHistory.length - 1].version;
    };

    // Get sub-specifications count
    const getSubSpecCount = (subSpecs?: { name: { en: string; ar: string } }[]): number => {
        return subSpecs?.length || 0;
    };

    if (isLoading) {
        return <TableSkeleton />;
    }

    if (specifications.length === 0) {
        return <EmptyState onAddSpecification={() => { }} />;
    }

    return (
        <div className="overflow-x-auto">
            <div className="min-w-full divide-y rounded-md border shadow-sm bg-white">
                {/* Table header */}
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 px-3 md:px-6 py-3 bg-gray-50 font-medium text-gray-600 text-sm ${isRtl ? 'text-right' : ''}`}>
                    <div>{t("name")}</div>
                    <div className="hidden sm:block">{t("id")}</div>
                    <div className="hidden md:block">{t("level")}</div>
                    <div className="hidden md:block">{t("subSpecifications")}</div>
                    <div className="hidden lg:block">{t("version")}</div>
                    <div className={`${isRtl ? "text-left" : "text-right"}`}>{t("actions")}</div>
                </div>

                {/* Table body */}
                <div className="divide-y">
                    {specifications.map((spec) => (
                        <div
                            key={spec.id}
                            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 px-3 md:px-6 py-4 items-center ${isRtl ? 'text-right' : ''}`}
                        >
                            <div className="font-medium truncate" title={spec.name[isRtl ? 'ar' : 'en']}>
                                {spec.name[isRtl ? 'ar' : 'en']}
                            </div>

                            <div className="hidden sm:block text-sm text-gray-700" title={spec.number}>
                                {spec.number}
                            </div>

                            <div className="hidden md:block">
                                <Badge className={`${getLevelColor(spec.capabilityLevel)}`}>
                                    {getLocalizedLevelName(spec.capabilityLevel, isRtl)}
                                </Badge>
                            </div>

                            <div className="hidden md:block text-sm text-gray-700">
                                {getSubSpecCount(spec.subSpecifications) > 0
                                    ? getSubSpecCount(spec.subSpecifications)
                                    : <span className="text-gray-400">{t("noSubSpecifications")}</span>}
                            </div>

                            <div className="hidden lg:block text-sm text-gray-700">
                                {getLatestVersion(spec)}
                            </div>

                            <div className={`${isRtl ? "text-left" : "text-right"} relative`}>
                                {refreshing === spec.id ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="hidden sm:flex justify-end gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewSpecification(spec)}
                                                className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                aria-label={t("viewDetails")}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEditSpecification(spec)}
                                                className="h-8 w-8 p-0 text-gray-700 border-gray-200 hover:bg-gray-100"
                                                aria-label={t("edit")}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onDeleteSpecification(spec.id)}
                                                className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                                                aria-label={t("delete")}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleDropdown(spec.id)}
                                            className="h-8 w-8 p-0 sm:hidden"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                {activeDropdown === spec.id && (
                                    <div
                                        ref={dropdownRef}
                                        className={`absolute ${isRtl ? "left-0" : "right-0"} top-full mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10`}
                                    >
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    onViewSpecification(spec);
                                                    setActiveDropdown(null);
                                                }}
                                                className={`flex w-full items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 ${isRtl ? "flex-row-reverse text-right" : ""}`}
                                            >
                                                <Eye className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                                                {t("viewDetails")}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onEditSpecification(spec);
                                                    setActiveDropdown(null);
                                                }}
                                                className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRtl ? "flex-row-reverse text-right" : ""}`}
                                            >
                                                <Pencil className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                                                {t("edit")}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onDeleteSpecification(spec.id);
                                                    setActiveDropdown(null);
                                                }}
                                                className={`flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 ${isRtl ? "flex-row-reverse text-right" : ""}`}
                                            >
                                                <Trash2 className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                                                {t("delete")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 