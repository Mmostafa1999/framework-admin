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
    Grid,
    PlusCircle,
    FileSpreadsheet,
    Search,
    X,
    AlertCircle,
    Layers,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { ControlCard } from "@/components/ui/controls/ControlCard";
import { ControlFormModal } from "@/components/ui/controls/ControlFormModal";
import { ControlImportExcel } from "@/components/ui/controls/ControlImportExcel";
import { useControls, Control } from "@/hooks/useControls";
import { useDomains } from "@/hooks/useDomains";
import { useToast } from "@/components/ui/use-toast";

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 },
    },
};

export default function DomainDetailsPage() {
    const t = useTranslations("ControlsManagement");
    const formT = useTranslations("ControlForm");
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

    const [searchTerm, setSearchTerm] = useState("");
    const [dimensionFilter, setDimensionFilter] = useState<string>("all");
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedControl, setSelectedControl] = useState<Control | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [domainName, setDomainName] = useState<string>("");

    const {
        controls,
        loading,
        error,
        fetchControls,
        createControl,
        updateControl,
        deleteControl
    } = useControls(frameworkId, domainId);

    const { getDomain } = useDomains(frameworkId);

    // Fetch domain name
    useEffect(() => {
        const fetchDomainDetails = async () => {
            const domain = await getDomain(domainId);
            if (domain) {
                setDomainName(domain.name[locale as "en" | "ar"] || domain.name.en);
            }
        };

        fetchDomainDetails();
    }, [domainId, getDomain, locale]);

    // Filter controls by search term and dimension
    const filteredControls = controls.filter(control => {
        const searchMatches = searchTerm === "" ||
            control.controlId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            control.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
            control.name.ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
            control.description.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
            control.description.ar.toLowerCase().includes(searchTerm.toLowerCase());

        const dimensionMatches = dimensionFilter === "all" || control.dimension === dimensionFilter;

        return searchMatches && dimensionMatches;
    });

    const handleCreateControl = async (data: any) => {
        try {
            const success = await createControl(
                {
                    name: data.name,
                    description: data.description,
                    dimension: data.dimension
                },
                data.controlId
            );

            if (success) {
                toast({
                    title: formT("controlCreated"),
                    description: formT("controlCreatedDescription", { name: data.name.en }),
                });
            }
        } catch (err) {
            console.error("Error creating control:", err);
            toast({
                title: t("formErrorTitle"),
                description: t("formErrorDescription"),
                variant: "destructive",
            });
        }
    };

    const handleUpdateControl = async (data: any, originalControlId?: string) => {
        if (!originalControlId) return;

        try {
            const success = await updateControl(originalControlId, {
                name: data.name,
                description: data.description,
                dimension: data.dimension
            });

            if (success) {
                toast({
                    title: formT("controlUpdated"),
                    description: formT("controlUpdatedDescription", { name: data.name.en }),
                });
            }
        } catch (err) {
            console.error("Error updating control:", err);
            toast({
                title: t("formErrorTitle"),
                description: t("formErrorDescription"),
                variant: "destructive",
            });
        }
    };

    const handleDeleteControl = async () => {
        if (!selectedControl) return;

        try {
            const success = await deleteControl(selectedControl.controlId);

            if (success) {
                toast({
                    title: t("controlDeleted"),
                });
            }
        } catch (err) {
            console.error("Error deleting control:", err);
            toast({
                title: t("deleteError"),
                description: t("deleteErrorDescription"),
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedControl(null);
        }
    };

    const openCreateModal = () => {
        setSelectedControl(null);
        setFormMode("create");
        setIsFormModalOpen(true);
    };

    const openEditModal = (control: Control) => {
        setSelectedControl(control);
        setFormMode("edit");
        setIsFormModalOpen(true);
    };

    const openDeleteDialog = (controlId: string) => {
        const control = controls.find(c => c.controlId === controlId);
        if (control) {
            setSelectedControl(control);
            setIsDeleteDialogOpen(true);
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    const clearFilters = () => {
        setSearchTerm("");
        setDimensionFilter("all");
    };

    // Get control IDs for duplicate check
    const controlIds = controls.map(control => control.controlId);

    const handleViewDetails = (controlId: string) => {
        router.push(`/${locale}/frameworks/${frameworkId}/domains/${domainId}/controls/${controlId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily, direction: isRtl ? 'rtl' : 'ltr' }}>
            {/* Hero Section */}
            <section className={`relative overflow-hidden bg-gradient-to-r from-[var(--primary-blue)] via-[var(--secondary-blue)] to-[var(--primary-green)] text-white ${loading && "animate-pulse"}`}>
                {/* Glowing decorative background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/5 rounded-full transform -translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    {/* Breadcrumbs */}
                    <div className="flex items-center mb-4 text-sm">
                        <Link href={`/${locale}/frameworks`} className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                            <BookOpen className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{sidebarT("frameworkManagement")}</span>
                        </Link>
                        <ChevronRight className={`h-4 w-4 mx-2 ${isRtl ? 'rotate-180' : ''}`} />
                        <Link href={`/${locale}/frameworks/${frameworkId}`} className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                            <span>{frameworkId}</span>
                        </Link>
                        <ChevronRight className={`h-4 w-4 mx-2 ${isRtl ? 'rotate-180' : ''}`} />
                        <span className="opacity-90">{domainName || domainId}</span>
                    </div>

                    <div className="flex flex-col">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">
                            {loading ? (
                                <div className="h-10 bg-white/20 rounded w-2/3"></div>
                            ) : (
                                t("controlsTitle", { domain: domainName || domainId })
                            )}
                        </h1>
                        <p className="text-white/80 max-w-3xl">
                            {loading ? (
                                <div className="h-4 mt-2 bg-white/20 rounded w-full max-w-md"></div>
                            ) : (
                                t("controlsDescription", { domain: domainName || domainId })
                            )}
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search, Filter and Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="w-full sm:max-w-md flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className={`absolute top-2.5 ${isRtl ? 'right-2' : 'left-2'} h-4 w-4 text-gray-400`} />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t("searchControls")}
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

                        {/* Dimension Filter */}
                        <div className="w-full sm:w-[180px]">
                            <Select
                                value={dimensionFilter}
                                onValueChange={setDimensionFilter}
                            >
                                <SelectTrigger className="bg-white">
                                    <Layers className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder={t("filterByDimension")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("allDimensions")}</SelectItem>
                                    <SelectItem value="plan">{t("plan")}</SelectItem>
                                    <SelectItem value="implement">{t("implement")}</SelectItem>
                                    <SelectItem value="operate">{t("operate")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row gap-2 w-full sm:w-auto">
                        <Button
                            onClick={openCreateModal}
                            className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white flex-1 sm:flex-none"
                        >
                            <PlusCircle className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{t("addControl")}</span>
                        </Button>
                        <Button
                            onClick={() => setIsImportModalOpen(true)}
                            variant="outline"
                            className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] hover:text-white text-white flex-1 sm:flex-none"
                        >
                            <FileSpreadsheet className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{t("importExcel")}</span>
                        </Button>
                    </div>
                </div>

                {/* Controls Grid */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Spinner className="w-8 h-8 mb-4" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-red-100 p-3 mb-4">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">{t("failedToFetchControls")}</h3>
                            <p className="text-gray-500 mb-6 max-w-md">{t("errorOccurredDuringFetch")}</p>
                            <Button onClick={() => fetchControls()} className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white">
                                {commonT("retry")}
                            </Button>
                        </div>
                    ) : filteredControls.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-gray-100 p-3 mb-4">
                                <Grid className="h-6 w-6 text-gray-400" />
                            </div>
                            {searchTerm || dimensionFilter !== "all" ? (
                                <>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noControlsFound")}</h3>
                                    <p className="text-gray-500 mb-6 max-w-md">
                                        {searchTerm && dimensionFilter !== "all"
                                            ? t("noControlsMatchFilter")
                                            : searchTerm
                                                ? t("noControlsMatchSearch")
                                                : t("noControlsMatchFilter")}
                                    </p>
                                    <Button
                                        onClick={clearFilters}
                                        className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white"
                                    >
                                        {searchTerm && dimensionFilter !== "all"
                                            ? t("clearFilters")
                                            : t("clearSearch")}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noControlsYet")}</h3>
                                    <p className="text-gray-500 mb-6 max-w-md">{t("createFirstControl")}</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredControls.map((control, index) => (
                                <ControlCard
                                    key={control.controlId}
                                    control={control}
                                    onEdit={openEditModal}
                                    onDelete={openDeleteDialog}
                                    onViewDetails={handleViewDetails}
                                    frameworkId={frameworkId}
                                    domainId={domainId}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Create/Edit Control Modal */}
            <ControlFormModal
                open={isFormModalOpen}
                onOpenChange={setIsFormModalOpen}
                mode={formMode}
                defaultValues={selectedControl || undefined}
                onSubmit={formMode === "create" ? handleCreateControl : handleUpdateControl}
                existingControlIds={controlIds}
            />

            {/* Import Excel Modal */}
            <ControlImportExcel
                frameworkId={frameworkId}
                domainId={domainId}
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                onImportComplete={fetchControls}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteControlConfirmation")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("deleteControlWarning")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{commonT("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteControl}
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