"use client";

import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { Calendar, Briefcase, Clock, Users, Link2, Pencil, Trash2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Project, Organization, Framework } from "@/types/firebase";
import { getLocalizedValue } from "@/types/firebase";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface ProjectCardProps {
    project: Project;
    organization?: Organization | null;
    framework?: Framework | null;
    onEdit: (project: Project) => void;
    onDelete: (projectId: string) => void;
}

// Card hover animation
const cardHover = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
};

export function ProjectCard({
    project,
    organization,
    framework,
    onEdit,
    onDelete
}: ProjectCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const t = useTranslations("ProjectManagement");
    const commonT = useTranslations("Common");
    const locale = useLocale();
    const isRtl = locale === "ar";

    // Get localized name based on current locale with fallback
    const projectName = getLocalizedValue(project.name, locale);
    const projectDescription = getLocalizedValue(project.description, locale);
    const orgName = organization ? getLocalizedValue(organization.name, locale) : t("owner");

    // Format framework name
    let frameworkName = "";
    if (framework) {
        if (typeof framework.name === 'string') {
            frameworkName = framework.name;
        } else if (framework.name && typeof framework.name === 'object') {
            frameworkName = getLocalizedValue(framework.name, locale);
        }
    }

    // Format dates
    const startDate = project.startDate ? format(new Date(project.startDate), "MMM d, yyyy", { locale: locale === 'ar' ? ar : enUS }) : "";
    const deadlineDate = project.projectDeadline ? format(new Date(project.projectDeadline), "MMM d, yyyy", { locale: locale === 'ar' ? ar : enUS }) : "";

    // Get status badge color
    const getStatusBadgeColor = () => {
        switch (project.status) {
            case "open":
                return "bg-green-500/80 text-white hover:bg-green-500/90 border-0";
            case "closed":
                return "bg-blue-500/80 text-white hover:bg-blue-500/90 border-0";
            case "on-holding":
                return "bg-amber-500/80 text-white hover:bg-amber-500/90 border-0";
            default:
                return "bg-white/20 text-white hover:bg-white/30 border-0";
        }
    };

    // Get localized status
    const getStatusText = () => {
        switch (project.status) {
            case "open":
                return t("status_open");
            case "closed":
                return t("status_closed");
            case "on-holding":
                return t("status_on-holding");
            default:
                return project.status;
        }
    };

    return (
        <motion.div
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            variants={cardHover}
            style={{ direction: isRtl ? "rtl" : "ltr" }}
        >
            <div className="w-full p-5 rounded-xl relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 flex flex-col">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 bg-white transform translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full opacity-10 bg-white transform -translate-x-1/3 translate-y-1/3" />

                {/* Main content */}
                <div className="flex flex-col gap-3 text-white h-full">
                    <div>
                        <h2 className="text-2xl font-bold">{projectName}</h2>
                    </div>



                    {/* Project Description */}
                    <p className="text-sm opacity-80 line-clamp-3 overflow-hidden">{projectDescription}</p>

                    {/* Status Badge */}
                    <Badge className={`w-fit ${getStatusBadgeColor()}`}>
                        {getStatusText()}
                    </Badge>

                    <div className="space-y-2 text-sm">
                        {/* Organization */}
                        {organization && (
                            <div className="flex items-center gap-1 text-sm opacity-80">
                                <Briefcase size={14} />
                                <span>{t("owner")}:</span>
                                <span className="font-medium">{orgName}</span>
                            </div>
                        )}

                        {/* Framework */}
                        {frameworkName && (
                            <div className="flex items-center gap-1 text-sm opacity-80">
                                <Link2 size={14} />
                                <span>{t("framework")}:</span>
                                <span className="font-medium">{frameworkName}</span>
                            </div>
                        )}

                        {/* Start Date */}
                        {startDate && (
                            <div className="flex items-center gap-1 text-sm opacity-80">
                                <Calendar size={14} />
                                <span>{t("startDate")}:</span>
                                <span className="font-medium">{startDate}</span>
                            </div>
                        )}

                        {/* Deadline */}
                        {deadlineDate && (
                            <div className="flex items-center gap-1 text-sm opacity-80">
                                <Clock size={14} />
                                <span>{t("deadline")}:</span>
                                <span className="font-medium">{deadlineDate}</span>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center mt-auto pt-4">
                        <motion.button
                            className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 hover:bg-white/30"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowDetails(true)}
                            aria-label={locale === 'ar' ? 'عرض التفاصيل' : 'Show details'}
                        >
                            <Info className="h-4 w-4" />
                            <span>{locale === 'ar' ? 'عرض التفاصيل' : 'Show details'}</span>
                        </motion.button>

                        <div className="flex gap-2">
                            <motion.button
                                className="w-10 h-10 flex items-center justify-center text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onEdit(project)}
                                aria-label={t("editProject")}
                            >
                                <Pencil className="h-4 w-4" />
                            </motion.button>

                            <motion.button
                                className="w-10 h-10 flex items-center justify-center text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onDelete(project.id)}
                                aria-label={t("deleteProject")}
                            >
                                <Trash2 className="h-4 w-4" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className={`sm:max-w-[500px] ${isRtl ? 'rtl' : 'ltr'} bg-gradient-to-br from-blue-600/95 to-green-600/95 text-white max-h-[85vh] overflow-y-auto overflow-x-hidden`}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{projectName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Badge className={`${getStatusBadgeColor()} mb-2`}>
                            {getStatusText()}
                        </Badge>
                        {/* Project Description */}
                        <div className="mb-4">
                            <p className="opacity-80">{locale === 'ar' ? 'وصف المشروع:' : 'Project Description:'}</p>
                            <p className="text-white max-h-[150px] overflow-y-auto overflow-x-hidden break-all whitespace-normal">{projectDescription}</p>
                        </div>


                        <div className="space-y-3">
                            {/* Organization */}
                            {organization && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Briefcase size={16} className="text-white/80" />
                                    <div>
                                        <span className="opacity-80">{t("owner")}: </span>
                                        <span className="font-medium">{orgName}</span>
                                    </div>
                                </div>
                            )}

                            {/* Framework */}
                            {frameworkName && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Link2 size={16} className="text-white/80" />
                                    <div>
                                        <span className="opacity-80">{t("framework")}: </span>
                                        <span className="font-medium">{frameworkName}</span>
                                    </div>
                                </div>
                            )}

                            {/* Start Date */}
                            {startDate && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar size={16} className="text-white/80" />
                                    <div>
                                        <span className="opacity-80">{t("startDate")}: </span>
                                        <span className="font-medium">{startDate}</span>
                                    </div>
                                </div>
                            )}

                            {/* Deadline */}
                            {deadlineDate && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock size={16} className="text-white/80" />
                                    <div>
                                        <span className="opacity-80">{t("deadline")}: </span>
                                        <span className="font-medium">{deadlineDate}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <motion.div
                        className="mt-5 flex justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <button
                            className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                            onClick={() => setShowDetails(false)}
                        >
                            {commonT("cancel")}
                        </button>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
} 