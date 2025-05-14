"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Organization, Framework } from "@/types/firebase";
import { getLocalizedValue } from "@/types/firebase";

interface ProjectFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedStatus: string;
    onStatusChange: (value: string) => void;
    selectedOrganization: string;
    onOrganizationChange: (value: string) => void;
    selectedFramework: string;
    onFrameworkChange: (value: string) => void;
    organizations: Organization[];
    frameworks: Framework[];
}

export function ProjectFilter({
    searchTerm,
    onSearchChange,
    selectedStatus,
    onStatusChange,
    selectedOrganization,
    onOrganizationChange,
    selectedFramework,
    onFrameworkChange,
    organizations,
    frameworks
}: ProjectFilterProps) {
    const t = useTranslations("ProjectManagement");
    const locale = useLocale();
    const isRtl = locale === "ar";

    return (
        <div className="bg-white border-b py-4 px-6 flex flex-wrap justify-between items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    className="pl-9 bg-gray-50 border-gray-200"
                    placeholder={t("searchProjects")}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {/* Status filter */}
                <Select
                    value={selectedStatus}
                    onValueChange={onStatusChange}
                >
                    <SelectTrigger className={`w-[140px] bg-gray-50 border-gray-200 ${isRtl ? "text-right" : ""}`}>
                        <SelectValue placeholder={t("filterByStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("allStatuses")}</SelectItem>
                        <SelectItem value="open">{t("status_open")}</SelectItem>
                        <SelectItem value="closed">{t("status_closed")}</SelectItem>
                        <SelectItem value="on-holding">{t("status_on-holding")}</SelectItem>
                    </SelectContent>
                </Select>

                {/* Organization filter */}
                <Select
                    value={selectedOrganization}
                    onValueChange={onOrganizationChange}
                >
                    <SelectTrigger className={`w-[180px] bg-gray-50 border-gray-200 ${isRtl ? "text-right" : ""}`}>
                        <SelectValue placeholder={t("filterByOrganization")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("allOrganizations")}</SelectItem>
                        {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                                {getLocalizedValue(org.name, locale)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Framework filter */}
                <Select
                    value={selectedFramework}
                    onValueChange={onFrameworkChange}
                >
                    <SelectTrigger className={`w-[160px] bg-gray-50 border-gray-200 ${isRtl ? "text-right" : ""}`}>
                        <SelectValue placeholder={t("filterByFramework")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("allFrameworks")}</SelectItem>
                        {frameworks.map((framework) => {
                            // Framework name might be a string or an object
                            let label;
                            if (typeof framework.name === 'string') {
                                label = framework.name;
                            } else if (framework.name && typeof framework.name === 'object') {
                                label = getLocalizedValue(framework.name, locale);
                            } else {
                                label = framework.id;
                            }

                            return (
                                <SelectItem key={framework.id} value={framework.id}>
                                    {label}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
} 