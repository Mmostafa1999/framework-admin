"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Pencil, Trash2, Info, ListTree, Link2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Domain } from "@/hooks/useDomains";
import { useLanguageFallback } from "@/lib/useLanguageFallback";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DomainCardProps {
    domain: Domain;
    onEdit: (domain: Domain) => void;
    onDelete: (domainId: string) => void;
    onViewDetails?: (domainId: string) => void;
    index?: number;
    frameworkId: string;
}

// Card hover animation
const cardHover = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
};

export function DomainCard({ domain, onEdit, onDelete, onViewDetails, frameworkId, index = 0 }: DomainCardProps) {
    const t = useTranslations("FrameworkManagement");
    const commonT = useTranslations("Common");
    const locale = useLocale();
    const isRtl = locale === "ar";
    const [showDetails, setShowDetails] = useState(false);
    const [preventNavigation, setPreventNavigation] = useState(false);

    // Handle language fallback
    const name = useLanguageFallback(domain.name, locale, domain.defaultLang);
    const description = useLanguageFallback(domain.description, locale, domain.defaultLang);
    const rawDomainField = domain.domainField || "";
    const domainField = useLanguageFallback(rawDomainField, locale, domain.defaultLang);

    // Parse domain fields into tags (split by comma)
    const domainTags = domainField ? domainField.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Function to handle card click to navigate to domain's control page
    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking on action buttons
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }

        // Don't navigate if we're showing/hiding the details dialog
        if (preventNavigation) {
            setPreventNavigation(false);
            return;
        }

        // Navigate to domain's control page
        if (onViewDetails) {
            onViewDetails(domain.domainId);
        }
    };

    // Function to handle dialog open/close while preventing navigation
    const handleDialogOpenChange = (open: boolean) => {
        setShowDetails(open);
        setPreventNavigation(true);
        // Reset the prevention after navigation would have occurred
        setTimeout(() => {
            setPreventNavigation(false);
        }, 100);
    };

    return (
        <motion.div
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            variants={cardHover}
            style={{ direction: isRtl ? "rtl" : "ltr" }}
            className="h-full cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="w-full h-[320px] p-5 rounded-xl relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 flex flex-col">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 bg-white transform translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full opacity-10 bg-white transform -translate-x-1/3 translate-y-1/3" />

                {/* Main content */}
                <div className="flex flex-col gap-3 text-white h-full">
                    {/* Title with fixed height */}
                    <div className="min-h-[40px]">
                        <h2 className="text-2xl font-bold truncate">{name}</h2>
                    </div>

                    {/* Description with fixed height */}
                    <div className="min-h-[60px] max-h-[60px] overflow-hidden">
                        <p className="text-sm opacity-80 line-clamp-3">{description || t("noDescription")}</p>
                    </div>

                    {/* Tags with fixed height */}
                    <div className="min-h-[40px] max-h-[40px] overflow-hidden">
                        {domainTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {domainTags.slice(0, 3).map((tag, i) => (
                                    <Badge key={i} className="bg-white/30 hover:bg-white/40 text-white border-0 font-normal">
                                        {tag}
                                    </Badge>
                                ))}
                                {domainTags.length > 3 && (
                                    <Badge className="bg-white/30 hover:bg-white/40 text-white border-0 font-normal">
                                        +{domainTags.length - 3}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Domain ID */}
                    <Badge className="w-fit bg-white/20 text-white hover:bg-white/30 border-0">
                        ID: {domain.domainId}
                    </Badge>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center mt-auto pt-4">
                        <motion.button
                            className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 hover:bg-white/30"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.preventDefault(); // Prevent default behavior
                                e.stopPropagation(); // Prevent card click
                                setPreventNavigation(true);
                                setShowDetails(true);
                            }}
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
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    onEdit(domain);
                                }}
                                aria-label={t("editDomain")}
                            >
                                <Pencil className="h-4 w-4" />
                            </motion.button>

                            <motion.button
                                className="w-10 h-10 flex items-center justify-center text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    onDelete(domain.domainId);
                                }}
                                aria-label={t("deleteDomain")}
                            >
                                <Trash2 className="h-4 w-4" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Domain Details Dialog */}
            <Dialog open={showDetails} onOpenChange={handleDialogOpenChange}>
                <DialogContent className={`sm:max-w-[500px] ${isRtl ? 'rtl' : 'ltr'} bg-gradient-to-br from-blue-600/95 to-green-600/95 text-white max-h-[85vh] overflow-y-auto overflow-x-hidden`}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Domain Description */}
                        <div className="mb-4">
                            <p className="opacity-80">{locale === 'ar' ? 'وصف المجال:' : 'Domain Description:'}</p>
                            <p className="text-white max-h-[150px] overflow-y-auto overflow-x-hidden break-all whitespace-normal">
                                {description || t("noDescription")}
                            </p>
                        </div>

                        {/* Domain Fields/Tags */}
                        {domainTags.length > 0 && (
                            <div className="mb-4">
                                <p className="opacity-80 mb-2">{locale === 'ar' ? 'المجالات:' : 'Domain Fields:'}</p>
                                <div className="flex flex-wrap gap-2">
                                    {domainTags.map((tag, i) => (
                                        <Badge key={i} className="bg-white/30 hover:bg-white/40 text-white border-0">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {/* Domain ID */}
                            <div className="flex items-center gap-2 text-sm">
                                <div>
                                    <span className="opacity-80">ID: </span>
                                    <span className="font-medium">{domain.domainId}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <motion.div
                        className="mt-5 flex justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <button
                            className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPreventNavigation(true);
                                setShowDetails(false);
                            }}
                        >
                            {commonT ? commonT("cancel") : t("cancel")}
                        </button>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}