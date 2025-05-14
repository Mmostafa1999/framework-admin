"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    BookOpen,
    ChevronRight,
    PlusCircle,
    FileSpreadsheet,
    AlertCircle,
    Grid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Spinner from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { SpecificationTable } from "@/components/ui/specifications/SpecificationTable";
import { SpecificationFormModal } from "@/components/ui/specifications/SpecificationFormModal";
import { SpecificationDetailsDialog } from "@/components/ui/specifications/SpecificationDetailsDialog";
import { SpecificationFilter } from "@/components/ui/specifications/SpecificationFilter";
import { SpecificationImportExcel } from "@/components/ui/specifications/SpecificationImportExcel";
import useSpecifications, { Specification } from "@/hooks/useSpecifications";
import { useControls } from "@/hooks/useControls";
import { useDomains } from "@/hooks/useDomains";

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 },
    },
};

export default function SpecificationsPage() {
    const t = useTranslations("SpecificationManagement");
    const formT = useTranslations("SpecificationForm");
    const commonT = useTranslations("Common");
    const sidebarT = useTranslations("Sidebar");
    const locale = useLocale();
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const isRtl = locale === "ar";
    const fontFamily = isRtl ? 'var(--font-cairo)' : 'var(--font-rubik)';
    const frameworkId = params.frameworkId as string;
    const domainId = params.domainId as string;
    const controlId = params.controlId as string;

    const [searchTerm, setSearchTerm] = useState("");
    const [levelFilter, setLevelFilter] = useState<string>("all");
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [selectedSpecification, setSelectedSpecification] = useState<Specification | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [domainName, setDomainName] = useState<string>("");
    const [controlName, setControlName] = useState<string>("");

    const {
        specifications,
        isLoading,
        error,
        fetchSpecifications,
        addSpecification,
        updateSpecification,
        deleteSpecification,
        importSpecifications,
        refreshing
    } = useSpecifications(controlId, frameworkId, domainId);

    const { getControl } = useControls(frameworkId, domainId);
    const { getDomain } = useDomains(frameworkId);

    // Fetch domain and control names
    useEffect(() => {
        const fetchNames = async () => {
            // Fetch domain name
            const domain = await getDomain(domainId);
            if (domain) {
                setDomainName(domain.name[locale as "en" | "ar"] || domain.name.en);
            }

            // Fetch control name
            const control = await getControl(controlId);
            if (control) {
                setControlName(control.name[locale as "en" | "ar"] || control.name.en);
            }
        };

        fetchNames();
    }, [controlId, domainId, getControl, getDomain, locale]);

    // Filter specifications by search term and level
    const filteredSpecifications = specifications.filter(spec => {
        const searchMatches = searchTerm === "" ||
            spec.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            spec.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
            spec.name.ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (spec.description?.en?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (spec.description?.ar?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

        const levelMatches = levelFilter === "all" || spec.capabilityLevel === levelFilter;

        return searchMatches && levelMatches;
    });

    const handleCreateSpecification = async (data: any) => {
        try {
            await addSpecification({
                number: data.number,
                name: data.name,
                description: data.description,
                capabilityLevel: data.capabilityLevel,
                subSpecifications: data.subSpecifications || [],
                versionHistory: data.versionHistory || []
            });

            toast({
                title: formT("addSpecification"),
                description: `${data.name[locale as "en" | "ar"] || data.name.en} ${t("specCreated")}`,
            });
        } catch (err) {
            console.error("Error creating specification:", err);
            toast({
                title: t("formError"),
                description: t("formErrorDescription"),
                variant: "destructive",
            });
        }
    };

    const handleUpdateSpecification = async (data: any, originalSpecId?: string) => {
        if (!originalSpecId) return;

        try {
            await updateSpecification(selectedSpecification?.id || "", {
                number: data.number,
                name: data.name,
                description: data.description,
                capabilityLevel: data.capabilityLevel,
                subSpecifications: data.subSpecifications || [],
                versionHistory: data.versionHistory || []
            });


        } catch (err) {
            console.error("Error updating specification:", err);
            toast({
                title: t("formError"),
                description: t("formErrorDescription"),
                variant: "destructive",
            });
        }
    };

    const handleDeleteSpecification = async () => {
        if (!selectedSpecification) return;

        try {
            await deleteSpecification(selectedSpecification.id);

            toast({
                title: t("specDeleted"),
            });
        } catch (err) {
            console.error("Error deleting specification:", err);
            toast({
                title: t("deleteError"),
                description: t("deleteErrorDescription"),
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedSpecification(null);
        }
    };

    const openCreateModal = () => {
        setSelectedSpecification(null);
        setFormMode("create");
        setIsFormModalOpen(true);
    };

    const openEditModal = (spec: Specification) => {
        setSelectedSpecification(spec);
        setFormMode("edit");
        setIsFormModalOpen(true);
    };

    const openDeleteDialog = (specId: string) => {
        const spec = specifications.find(s => s.id === specId);
        if (spec) {
            setSelectedSpecification(spec);
            setIsDeleteDialogOpen(true);
        }
    };

    const openDetailsDialog = (spec: Specification) => {
        setSelectedSpecification(spec);
        setIsDetailsDialogOpen(true);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setLevelFilter("all");
    };

    // Get specification IDs for duplicate check
    const specificationNumbers = specifications.map(spec => spec.number);

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily, direction: isRtl ? 'rtl' : 'ltr' }}>
            {/* Hero Section */}
            <section className={`relative overflow-hidden bg-gradient-to-r from-[var(--primary-blue)] via-[var(--secondary-blue)] to-[var(--primary-green)] text-white ${isLoading && "animate-pulse"}`}>
                {/* Glowing decorative background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/5 rounded-full transform -translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center mb-3 text-xs sm:text-sm overflow-x-auto whitespace-nowrap pb-2">
                        <Link href={`/${locale}/frameworks`} className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                            <BookOpen className={`h-3 w-3 sm:h-4 sm:w-4 ${isRtl ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`} />
                            <span>{sidebarT("frameworkManagement")}</span>
                        </Link>
                        <ChevronRight className={`h-3 w-3 sm:h-4 sm:w-4 mx-1 sm:mx-2 ${isRtl ? 'rotate-180' : ''}`} />
                        <Link href={`/${locale}/frameworks/${frameworkId}`} className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                            <span>{frameworkId}</span>
                        </Link>
                        <ChevronRight className={`h-3 w-3 sm:h-4 sm:w-4 mx-1 sm:mx-2 ${isRtl ? 'rotate-180' : ''}`} />
                        <Link href={`/${locale}/frameworks/${frameworkId}/domains/${domainId}`} className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                            <span className="truncate max-w-[100px] sm:max-w-none">{domainName || domainId}</span>
                        </Link>
                        <ChevronRight className={`h-3 w-3 sm:h-4 sm:w-4 mx-1 sm:mx-2 ${isRtl ? 'rotate-180' : ''}`} />
                        <Link href={`/${locale}/frameworks/${frameworkId}/domains/${domainId}/controls/${controlId}`} className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                            <span className="truncate max-w-[100px] sm:max-w-none">{controlName || controlId}</span>
                        </Link>
                    </div>

                    <div className="flex flex-col">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 truncate">
                            {isLoading ? (
                                <div className="h-8 sm:h-10 bg-white/20 rounded w-2/3"></div>
                            ) : (
                                t("specificationsTitle", { control: controlName || controlId })
                            )}
                        </h1>
                        <p className="text-white/80 max-w-3xl text-sm sm:text-base">
                            {isLoading ? (
                                <div className="h-4 mt-2 bg-white/20 rounded w-full max-w-md"></div>
                            ) : (
                                t("specificationsDescription", { control: controlName || controlId })
                            )}
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                {/* Search, Filter and Actions */}
                <div className="flex flex-col lg:flex-row mb-4 sm:mb-6 gap-4">
                    <div className="w-full lg:flex-1">
                        <SpecificationFilter
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            levelFilter={levelFilter}
                            setLevelFilter={setLevelFilter}
                            onClearFilters={clearFilters}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-shrink-0 gap-2 lg:self-end">
                        <Button
                            onClick={openCreateModal}
                            className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white w-full sm:w-auto"
                        >
                            <PlusCircle className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{t("addSpecification")}</span>
                        </Button>
                        <Button
                            onClick={() => setIsImportModalOpen(true)}
                            variant="outline"
                            className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] hover:text-white text-white w-full sm:w-auto"
                        >
                            <FileSpreadsheet className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{t("importExcel")}</span>
                        </Button>
                    </div>
                </div>

                {/* Specifications Table */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                            <Spinner className="w-8 h-8 mb-4" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                            <div className="rounded-full bg-red-100 p-3 mb-4">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">{t("fetchError")}</h3>
                            <p className="text-gray-500 mb-6 max-w-md px-4">{t("fetchErrorDescription")}</p>
                            <Button onClick={() => fetchSpecifications()} className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white">
                                {commonT("retry")}
                            </Button>
                        </div>
                    ) : filteredSpecifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                            <div className="rounded-full bg-gray-100 p-3 mb-4">
                                <Grid className="h-6 w-6 text-gray-400" />
                            </div>
                            {searchTerm || levelFilter !== "all" ? (
                                <>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noSpecificationsFound")}</h3>
                                    <p className="text-gray-500 mb-6 max-w-md px-4">{t("noSpecificationsDescription")}</p>
                                    <Button
                                        onClick={clearFilters}
                                        className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white"
                                    >
                                        {searchTerm && levelFilter !== "all"
                                            ? t("clearFilters")
                                            : t("clearSearch")}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noSpecificationsYet")}</h3>
                                    <p className="text-gray-500 mb-6 max-w-md px-4">{t("createFirstSpecification")}</p>
                                    <Button
                                        onClick={openCreateModal}
                                        className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white"
                                    >
                                        {t("addSpecification")}
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <SpecificationTable
                            specifications={filteredSpecifications}
                            isLoading={isLoading}
                            isRtl={isRtl}
                            refreshing={refreshing}
                            onViewSpecification={openDetailsDialog}
                            onEditSpecification={openEditModal}
                            onDeleteSpecification={openDeleteDialog}
                        />
                    )}
                </motion.div>
            </div>

            {/* Create/Edit Specification Modal */}
            <SpecificationFormModal
                open={isFormModalOpen}
                onOpenChange={setIsFormModalOpen}
                mode={formMode}
                defaultValues={selectedSpecification ? {
                    ...selectedSpecification,
                    versionHistory: selectedSpecification.versionHistory?.map(version => ({
                        ...version,
                        date: typeof version.date === 'string'
                            ? version.date
                            : version.date.toDate().toISOString().split('T')[0]
                    }))
                } : undefined}
                onSubmit={formMode === "create" ? handleCreateSpecification : handleUpdateSpecification}
                existingSpecificationIds={specificationNumbers}
            />

            {/* Import Excel Modal */}
            <SpecificationImportExcel
                controlId={controlId}
                frameworkId={frameworkId}
                domainId={domainId}
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                onImportComplete={fetchSpecifications}
            />

            {/* Specification Details Dialog */}
            <SpecificationDetailsDialog
                open={isDetailsDialogOpen}
                onOpenChange={setIsDetailsDialogOpen}
                specification={selectedSpecification}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md mx-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteSpecConfirmation")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("deleteSpecWarning")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel className="mt-0">{commonT("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSpecification}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        >
                            {commonT("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
