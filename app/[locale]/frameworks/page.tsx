"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
    Plus,
    Trash2,
    Pencil,
    Calendar,
    BookOpen,
    HelpCircle,
    ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FrameworkFormDialog } from "@/components/ui/frameworks/FrameworkFormDialog";
import { FrameworkFormValues } from "@/components/ui/frameworks/FrameworkFormModal";
import { useToast } from "@/components/ui/use-toast";
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
import { useDashboardStats, DashboardStatsProvider } from "@/context/DashboardStatsContext";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    getAllFrameworks,
    getFrameworkById,
    createFramework,
    updateFramework,
    deleteFramework,
    createOrUpdateNPCFramework,
    migrateToNpcFramework
} from "@/lib/services/frameworkService";
import { Framework } from "@/types/firebase";
import { getLocalizedValue } from "@/types/firebase";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 },
    },
};

// Card hover animation
const cardHover = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.03, y: -2 },
    tap: { scale: 0.98 }
};

export default function FrameworksPage() {
    const t = useTranslations("FrameworkManagement");
    const commonT = useTranslations("Common");
    const sidebarT = useTranslations("Sidebar");
    const locale = useLocale();
    const router = useRouter();
    const isRtl = locale === "ar";
    const fontFamily = isRtl ? 'var(--font-cairo)' : 'var(--font-rubik)';
    const { toast } = useToast();
    const dashboardStats = useDashboardStats();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState<string | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [frameworkFormOpen, setFrameworkFormOpen] = useState(false);
    const [frameworkFormMode, setFrameworkFormMode] = useState<"create" | "edit">("create");
    const [selectedFramework, setSelectedFramework] = useState<Partial<FrameworkFormValues> | undefined>(undefined);
    const [frameworks, setFrameworks] = useState<Framework[]>([]);
    const [frameworkToDelete, setFrameworkToDelete] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

    // Initialize the NPC framework on page load
    useEffect(() => {
        const initializeNPCFramework = async () => {
            try {
                // Try to migrate from old ID first if it exists
                const migrated = await migrateToNpcFramework("SbvyHowRSFOIyPnSA77B");

                if (!migrated) {
                    // If no migration happened, ensure the NPC framework exists
                    await createOrUpdateNPCFramework();
                } else {
                }
            } catch (error) {
                console.error("Failed to initialize NPC framework:", error);
            }
        };

        initializeNPCFramework();
    }, []);

    // Fetch frameworks from Firestore
    useEffect(() => {
        const fetchFrameworks = async () => {
            try {
                setLoading(true);
                const fetchedFrameworks = await getAllFrameworks();
                setFrameworks(fetchedFrameworks);
            } catch (error) {
                console.error("Error fetching frameworks:", error);
                toast({
                    variant: "destructive",
                    title: t("fetchError"),
                    description: t("fetchErrorDescription"),
                });
            } finally {
                setLoading(false);
            }
        };

        fetchFrameworks();
    }, [t, toast]);

    // Format date for display
    const formatDate = (timestamp: any) => {
        if (!timestamp || !timestamp.toDate) return '';

        const date = timestamp.toDate();
        const dateLocale = locale === 'ar' ? ar : enUS;

        return format(date, 'dd MMM yyyy', { locale: dateLocale });
    };

    // Handle opening the create framework form
    const handleAddFramework = () => {
        setFrameworkFormMode("create");
        setSelectedFramework(undefined);
        setFrameworkFormOpen(true);
    };

    // Handle opening the edit framework form
    const handleEditFramework = (framework: Framework) => {
        setFrameworkFormMode("edit");
        setSelectedFramework({
            id: framework.id,
            name: framework.name || "",
            description: {
                en: framework.description?.en || "",
                ar: framework.description?.ar || ""
            }
        });
        setFrameworkFormOpen(true);
        setActiveDropdown(null);
    };

    // After successful update, fetch the latest framework data to ensure all changes are reflected
    const refreshFrameworkData = async (frameworkId: string) => {
        try {
            setRefreshing(frameworkId);
            const updatedFramework = await getFrameworkById(frameworkId);

            if (updatedFramework) {
                // Update the specific framework with all latest data
                setFrameworks(prevFrameworks =>
                    prevFrameworks.map(fw =>
                        fw.id === frameworkId
                            ? updatedFramework
                            : fw
                    )
                );
            } else {
                console.warn("No framework found with ID:", frameworkId);
            }
        } catch (error) {
            console.error("Error refreshing framework data:", error);
        } finally {
            setRefreshing(null);
        }
    };

    // Handle form submission
    const handleFormSubmit = async (data: FrameworkFormValues) => {
        try {
            if (frameworkFormMode === "create") {
                // Create new framework

                // Call the service to create the framework in Firestore
                const frameworkId = await createFramework(data.name, data.description);

                if (!frameworkId) {
                    throw new Error("Failed to create framework - no ID returned");
                }


                // Fetch the newly created framework with complete data
                const newFramework = await getFrameworkById(frameworkId);

                if (newFramework) {

                    // Add the new framework to the state
                    setFrameworks(prevFrameworks => [
                        ...prevFrameworks,
                        newFramework
                    ]);

                    // Success will be handled by the form dialog component
                } else {
                    console.error("Created framework could not be retrieved");
                    throw new Error("Created framework could not be retrieved");
                }
            } else if (frameworkFormMode === "edit" && selectedFramework) {
                // Get the framework ID
                const frameworkId = selectedFramework.id;

                if (!frameworkId) {
                    throw new Error("Framework ID is missing for update operation");
                }


                // Update the framework in Firestore
                await updateFramework(frameworkId, {
                    name: data.name,
                    description: {
                        en: data.description.en,
                        ar: data.description.ar
                    },
                });


                // Refresh the framework data
                await refreshFrameworkData(frameworkId);
            }

            // Close the form
            setFrameworkFormOpen(false);

            // Notify dashboard stats if needed
            if (dashboardStats) {
                dashboardStats.notifyRefresh('frameworks');
            }
        } catch (error) {
            console.error("Error submitting framework form:", error);
            toast({
                variant: "destructive",
                title: t("formErrorTitle"),
                description: error instanceof Error ? error.message : t("formErrorDescription"),
            });
        }
    };

    // Toggle framework dropdown
    const toggleDropdown = (frameworkId: string) => {
        if (activeDropdown === frameworkId) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(frameworkId);
        }
    };

    // Handle framework deletion
    const handleDeleteFramework = async () => {
        if (!frameworkToDelete) return;

        try {
            await deleteFramework(frameworkToDelete);

            // Remove framework from local state
            setFrameworks(prevFrameworks => prevFrameworks.filter(fw => fw.id !== frameworkToDelete));

            toast({
                title: t("frameworkDeleted"),
                duration: 3000,
            });

            // Notify the dashboard to refresh data if needed
            try {
                if (dashboardStats) {
                    dashboardStats.notifyRefresh('frameworks');
                }
            } catch (error) {
                // Dashboard context might not be available, ignore the error
            }

            setFrameworkToDelete(null);
        } catch (error) {
            console.error("Error deleting framework:", error);
            toast({
                variant: "destructive",
                title: t("deleteError"),
                description: t("deleteErrorDescription"),
            });
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Prepare the confirmation dialog for deleting a framework
    const confirmDeleteFramework = (frameworkId: string) => {
        setFrameworkToDelete(frameworkId);
        setDeleteDialogOpen(true);
        setActiveDropdown(null);
    };

    // Filter frameworks based on search term
    const filteredFrameworks = frameworks;

    // Skeleton component for loading state
    const CardsSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="h-60 bg-gray-200 rounded-xl w-full"></div>
                </div>
            ))}
        </div>
    );

    // Empty state component
    const EmptyState = () => {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noFrameworksFound")}</h3>
                <p className="text-sm text-gray-500 mb-4">{t("noFrameworksDescription")}</p>
                <Button
                    className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] hover:text-white text-white transition-colors duration-300"
                    onClick={handleAddFramework}
                >
                    <Plus size={16} className={isRtl ? "ml-2" : "mr-2"} />
                    <span>{t("addFramework")}</span>
                </Button>
            </div>
        );
    };

    // Handle navigating to framework details page
    const handleFrameworkClick = (frameworkId: string) => {
        router.push(`/${locale}/frameworks/${frameworkId}`);
    };

    return (
        <DashboardStatsProvider>
            <div className="min-h-screen bg-gray-50" style={{ fontFamily, direction: isRtl ? 'rtl' : 'ltr' }}>
                {/* Hero Section */}
                <section className={`relative overflow-hidden bg-gradient-to-r from-[var(--primary-blue)] via-[var(--secondary-blue)] to-[var(--primary-green)] text-white ${loading && "animate-pulse"}`}>
                    {/* Glowing decorative background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/5 rounded-full transform -translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                        <div className="flex flex-col">
                            <div className="flex items-center mb-2">
                                <BookOpen className="h-5 w-5 mr-2 opacity-80" />
                                <span className="text-sm opacity-80">{t("administration")}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-3">
                                {loading ? (
                                    <div className="h-10 bg-white/20 rounded w-2/3"></div>
                                ) : (
                                    sidebarT("frameworkManagement")
                                )}
                            </h1>
                            <p className="text-white/80 max-w-3xl">
                                {loading ? (
                                    <div className="h-4 mt-2 bg-white/20 rounded w-full max-w-md"></div>
                                ) : (
                                    t("frameworkManagementDescription")
                                )}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Frameworks Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="overflow-hidden">
                        <CardHeader
                            className="bg-white border-b pb-4 px-6 flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4"
                            dir={isRtl ? "rtl" : "ltr"} // Important for direction
                        >
                            <div className={`w-full flex justify-end items-center flex-col sm:flex-row ${isRtl ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
                                {/* Button */}
                                <div className="flex items-center gap-3">
                                    <Button
                                        className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white transition-colors duration-300"
                                        onClick={handleAddFramework}
                                    >
                                        <Plus size={16} className={isRtl ? "ml-2" : "mr-2"} />
                                        <span>{t("addFramework")}</span>
                                    </Button>
                                </div>


                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            {/* Frameworks Grid */}
                            {loading ? (
                                <CardsSkeleton />
                            ) : filteredFrameworks.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                    {filteredFrameworks.map((framework) => (
                                        <motion.div
                                            key={framework.id}
                                            initial="rest"
                                            whileHover="hover"
                                            whileTap="tap"
                                            variants={cardHover}
                                            className="
                                                w-full p-5 rounded-xl relative overflow-hidden 
                                                bg-gradient-to-r from-blue-600 to-green-600
                                                hover:from-blue-500 hover:to-green-500
                                                flex flex-col cursor-pointer
                                            "
                                            onClick={() => handleFrameworkClick(framework.id)}
                                        >
                                            {/* Decorative elements */}
                                            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 bg-white transform translate-x-1/3 -translate-y-1/3" />
                                            <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full opacity-10 bg-white transform -translate-x-1/3 translate-y-1/3" />

                                            {/* Main content */}
                                            <div className="flex flex-col gap-3 text-white h-full">
                                                <div>
                                                    <h2 className="text-2xl font-bold">{framework.name}</h2>
                                                </div>

                                                {/* Description - display correct localized content */}
                                                {framework.description && (
                                                    <div className="mt-1">
                                                        <p className="text-sm opacity-90">
                                                            {framework.description[locale] || framework.description.en}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Action buttons */}
                                                <div className="flex justify-end items-center mt-auto pt-4">
                                                    <div className="flex gap-2">
                                                        <motion.button
                                                            className="w-10 h-10 flex items-center justify-center text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditFramework(framework);
                                                            }}
                                                            aria-label={t("editFramework")}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </motion.button>

                                                        <motion.button
                                                            className="w-10 h-10 flex items-center justify-center text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                confirmDeleteFramework(framework.id);
                                                            }}
                                                            aria-label={t("deleteFramework")}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Framework Form Dialog */}
                <FrameworkFormDialog
                    open={frameworkFormOpen}
                    onOpenChange={setFrameworkFormOpen}
                    mode={frameworkFormMode}
                    defaultValues={selectedFramework}
                    onSubmit={handleFormSubmit}
                />

                {/* Delete Framework Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteFrameworkConfirmation")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("deleteFrameworkWarning")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{commonT("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteFramework}
                                className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                            >
                                {commonT("delete")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardStatsProvider>
    );
} 