"use client";

import { useState } from "react";
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
    ClipboardList
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
import Spinner from "@/components/ui/spinner";
import { DomainCard } from "@/components/ui/domains/DomainCard";
import { DomainFormModal } from "@/components/ui/domains/DomainFormModal";
import { DomainImportExcel } from "@/components/ui/domains/DomainImportExcel";
import { useDomains, Domain } from "@/hooks/useDomains";
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

export default function FrameworkDetailsPage() {
    const t = useTranslations("FrameworkManagement");
    const formT = useTranslations("DomainForm");
    const commonT = useTranslations("Common");
    const sidebarT = useTranslations("Sidebar");
    const locale = useLocale();
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const isRtl = locale === "ar";
    const fontFamily = isRtl ? 'var(--font-cairo)' : 'var(--font-rubik)';
    const frameworkId = params.frameworkId as string;

    const [searchTerm, setSearchTerm] = useState("");
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");

    const {
        domains,
        loading,
        error,
        fetchDomains,
        createDomain,
        updateDomain,
        deleteDomain
    } = useDomains(frameworkId);

    const filteredDomains = domains.filter(domain => {
        const searchLower = searchTerm.toLowerCase();
        return (
            domain.domainId.toLowerCase().includes(searchLower) ||
            domain.name.en.toLowerCase().includes(searchLower) ||
            domain.name.ar.toLowerCase().includes(searchLower) ||
            domain.description.en.toLowerCase().includes(searchLower) ||
            domain.description.ar.toLowerCase().includes(searchLower)
        );
    });

    const handleCreateDomain = async (data: any) => {
        try {
            const success = await createDomain(
                {
                    name: data.name,
                    description: data.description,
                    domainField: data.domainField,
                    defaultLang: data.defaultLang
                },
                data.domainId
            );

            if (success) {
                toast({
                    title: formT("domainCreated"),
                    description: formT("domainCreatedDescription", { name: data.name.en }),
                });
            }
        } catch (err) {
            console.error("Error creating domain:", err);
            toast({
                title: t("formErrorTitle"),
                description: t("formErrorDescription"),
                variant: "destructive",
            });
        }
    };

    const handleUpdateDomain = async (data: any, originalDomainId?: string) => {
        if (!originalDomainId) return;

        try {
            const success = await updateDomain(originalDomainId, {
                name: data.name,
                description: data.description,
                domainField: data.domainField,
                defaultLang: data.defaultLang
            });

            if (success) {
                toast({
                    title: formT("domainUpdated"),
                    description: formT("domainUpdatedDescription", { name: data.name.en }),
                });
            }
        } catch (err) {
            console.error("Error updating domain:", err);
            toast({
                title: t("formErrorTitle"),
                description: t("formErrorDescription"),
                variant: "destructive",
            });
        }
    };

    const handleDeleteDomain = async () => {
        if (!selectedDomain) return;

        try {
            const success = await deleteDomain(selectedDomain.domainId);

            if (success) {
                toast({
                    title: t("domainDeleted"),
                });
            }
        } catch (err) {
            console.error("Error deleting domain:", err);
            toast({
                title: t("deleteError"),
                description: t("deleteErrorDescription"),
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedDomain(null);
        }
    };

    const openCreateModal = () => {
        setSelectedDomain(null);
        setFormMode("create");
        setIsFormModalOpen(true);
    };

    const openEditModal = (domain: Domain) => {
        setSelectedDomain(domain);
        setFormMode("edit");
        setIsFormModalOpen(true);
    };

    const openDeleteDialog = (domainId: string) => {
        const domain = domains.find(d => d.domainId === domainId);
        if (domain) {
            setSelectedDomain(domain);
            setIsDeleteDialogOpen(true);
        }
    };

    const handleViewDetails = (domainId: string) => {
        router.push(`/${locale}/frameworks/${frameworkId}/domains/${domainId}`);
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    // Get domain IDs for duplicate check
    const domainIds = domains.map(domain => domain.domainId);

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily, direction: isRtl ? 'rtl' : 'ltr' }}>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-r from-[var(--primary-blue)] via-[var(--secondary-blue)] to-[var(--primary-green)] text-white">
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
                        <span className="opacity-90">{`${frameworkId}`}</span>
                    </div>

                    <div className="flex flex-col">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("frameworkTitle", { framework: frameworkId })}</h1>
                        <p className="text-white/80 max-w-3xl">{t("frameworkDescription", { framework: frameworkId })}</p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className={`absolute top-2.5 ${isRtl ? 'right-2' : 'left-2'} h-4 w-4 text-gray-400`} />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t("searchDomains")}
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

                    {/* Action Buttons */}
                    <div className="flex flex-row gap-2 w-full sm:w-auto">
                        <Button
                            onClick={openCreateModal}
                            className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white flex-1 sm:flex-none"
                        >
                            <PlusCircle className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{t("addDomain")}</span>
                        </Button>
                        <Button
                            onClick={() => setIsImportModalOpen(true)}
                            variant="outline"
                            className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] hover:text-white text-white flex-1 sm:flex-none"
                        >
                            <FileSpreadsheet className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{t("importExcel")}</span>
                        </Button>
                        <Link href={`/${locale}/frameworks/${frameworkId}/criteria`}>
                            <Button
                                className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white flex-1 sm:flex-none"
                            >
                                <ClipboardList className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                <span>{t("assessmentCriteria")}</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Domains Grid */}
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
                            <h3 className="text-lg font-medium text-gray-900 mb-1">{t("failedToFetchDomains")}</h3>
                            <p className="text-gray-500 mb-6 max-w-md">{t("errorOccurredDuringFetch")}</p>
                            <Button onClick={() => fetchDomains()} className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white">
                                {commonT("retry")}
                            </Button>
                        </div>
                    ) : filteredDomains.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-gray-100 p-3 mb-4">
                                <Grid className="h-6 w-6 text-gray-400" />
                            </div>
                            {searchTerm ? (
                                <>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noDomainsFound")}</h3>
                                    <p className="text-gray-500 mb-6 max-w-md">{t("noDomainsMatchSearch")}</p>
                                    <Button
                                        onClick={clearSearch}
                                        className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white"
                                    >
                                        {t("clearSearch")}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noDomainsYet")}</h3>
                                    <p className="text-gray-500 mb-6 max-w-md">{t("createFirstDomain")}</p>

                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredDomains.map((domain, index) => (
                                <DomainCard
                                    key={domain.domainId}
                                    domain={domain}
                                    onEdit={openEditModal}
                                    onDelete={openDeleteDialog}
                                    onViewDetails={handleViewDetails}
                                    frameworkId={frameworkId}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Create/Edit Domain Modal */}
            <DomainFormModal
                open={isFormModalOpen}
                onOpenChange={setIsFormModalOpen}
                mode={formMode}
                defaultValues={selectedDomain || undefined}
                onSubmit={formMode === "create" ? handleCreateDomain : handleUpdateDomain}
                existingDomainIds={domainIds}
            />

            {/* Import Excel Modal */}
            <DomainImportExcel
                frameworkId={frameworkId}
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                onImportComplete={fetchDomains}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteDomainConfirmation")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("deleteDomainWarning")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{commonT("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDomain}
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