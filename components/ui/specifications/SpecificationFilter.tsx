"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Search, X, Filter, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CapabilityLevel } from "@/hooks/useSpecifications";

interface SpecificationFilterProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    levelFilter: string;
    setLevelFilter: (level: string) => void;
    onClearFilters: () => void;
}

export function SpecificationFilter({
    searchTerm,
    setSearchTerm,
    levelFilter,
    setLevelFilter,
    onClearFilters,
}: SpecificationFilterProps) {
    const t = useTranslations("SpecificationManagement");
    const locale = useLocale();
    const isRtl = locale === "ar";

    const clearSearch = () => {
        setSearchTerm("");
    };

    return (
        <div className="flex flex-col lg:flex-row gap-3 w-full">
            {/* Search */}
            <div className="relative flex-1">
                <Search className={`absolute top-2.5 ${isRtl ? 'right-2' : 'left-2'} h-4 w-4 text-gray-400`} />
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t("searchSpecifications")}
                    className={`${isRtl ? 'pr-8' : 'pl-8'} bg-white`}
                />
                {searchTerm && (
                    <button
                        onClick={clearSearch}
                        className={`absolute top-2.5 ${isRtl ? 'left-2' : 'right-2'} text-gray-400 hover:text-gray-600`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row lg:w-auto gap-3">
                {/* Level Filter */}
                <div className="w-full sm:max-w-[250px] lg:w-[250px]">
                    <Select
                        value={levelFilter}
                        onValueChange={setLevelFilter}
                    >
                        <SelectTrigger className="bg-white">
                            <Layers className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{t("filterByCapabilityLevel")}</span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("allLevels")}</SelectItem>
                            <SelectItem value="foundational">
                                {isRtl ? "اساسيه" : "Foundational"}
                            </SelectItem>
                            <SelectItem value="advanced">
                                {isRtl ? "متقدمه" : "Advanced"}
                            </SelectItem>
                            <SelectItem value="veryAdvanced">
                                {isRtl ? "متقدمه جدا" : "Very Advanced"}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Clear Filters (only shown when filters are active) */}
                {(searchTerm || levelFilter !== "all") && (
                    <Button
                        variant="outline"
                        onClick={onClearFilters}
                        className="w-full sm:w-auto whitespace-nowrap"
                    >
                        <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                        {t("clearFilters")}
                    </Button>
                )}
            </div>
        </div>
    );
} 