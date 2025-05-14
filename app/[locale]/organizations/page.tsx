"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
    Search,
    Plus,
    Trash2,
    Pencil,
    RefreshCw,
    Calendar,
    Building2,
    Users,
    Briefcase,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationFormDialog } from "@/components/ui/organizations/OrganizationFormDialog";
import { OrganizationFormValues } from "@/components/ui/organizations/OrganizationFormModal";
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
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import {
    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization,
    deleteOrganization
} from "@/lib/services/organizationService";
import { getAllProjects } from "@/lib/services/projectService";
import { Organization, Project } from "@/types/firebase";
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

export default function OrganizationsPage() {
    const t = useTranslations("OrganizationManagement");
    const commonT = useTranslations("Common");
    const sidebarT = useTranslations("Sidebar");
    const locale = useLocale();
    const isRtl = locale === "ar";
    const fontFamily = isRtl ? 'var(--font-cairo)' : 'var(--font-rubik)';
    const { toast } = useToast();
    const dashboardStats = useDashboardStats();

    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState<string | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [organizationFormOpen, setOrganizationFormOpen] = useState(false);
    const [organizationFormMode, setOrganizationFormMode] = useState<"create" | "edit">("create");
    const [selectedOrganization, setSelectedOrganization] = useState<Partial<OrganizationFormValues> | undefined>(undefined);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [organizationToDelete, setOrganizationToDelete] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);

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

    // Fetch organizations from Firestore
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                setLoading(true);
                const fetchedOrganizations = await getAllOrganizations();
                setOrganizations(fetchedOrganizations);
            } catch (error) {
                console.error("Error fetching organizations:", error);
                toast({
                    variant: "destructive",
                    title: t("fetchError"),
                    description: t("fetchErrorDescription"),
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizations();
    }, [t, toast]);

    // Fetch projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setProjectsLoading(true);
                const fetchedProjects = await getAllProjects();
                setProjects(fetchedProjects);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setProjectsLoading(false);
            }
        };

        fetchProjects();
    }, []);

    // Get projects for an organization
    const getOrganizationProjects = (projectIds: string[] = []) => {
        return projects.filter(project => projectIds.includes(project.id));
    };

    // Format date for display
    const formatDate = (timestamp: any) => {
        if (!timestamp || !timestamp.toDate) return '';

        const date = timestamp.toDate();
        const dateLocale = locale === 'ar' ? ar : enUS;

        return format(date, 'dd MMM yyyy', { locale: dateLocale });
    };

    // Handle opening the create organization form
    const handleAddOrganization = () => {
        setOrganizationFormMode("create");
        setSelectedOrganization({
            name: { en: "", ar: "" },
            assignedProjects: [],
            projects: []
        });
        setOrganizationFormOpen(true);
    };

    // Handle opening the edit organization form
    const handleEditOrganization = (organization: Organization) => {
        setOrganizationFormMode("edit");
        setSelectedOrganization({
            id: organization.id,
            name: {
                en: organization.name.en || "",
                ar: organization.name.ar || ""
            },
            assignedProjects: organization.projectIds || [],
            projects: organization.projectIds || []
        });
        setOrganizationFormOpen(true);
        setActiveDropdown(null);
    };

    // After successful update, fetch the latest organization data to ensure all changes are reflected
    const refreshOrganizationData = async (organizationId: string) => {
        try {
            setRefreshing(organizationId);
            const updatedOrganization = await getOrganizationById(organizationId);
            if (updatedOrganization) {
                // Update the specific organization with all latest data
                setOrganizations(prevOrganizations =>
                    prevOrganizations.map(org =>
                        org.id === organizationId
                            ? updatedOrganization
                            : org
                    )
                );
            }
        } catch (error) {
            console.error("Error refreshing organization data:", error);
        } finally {
            setRefreshing(null);
        }
    };

    // Handle form submission
    const handleFormSubmit = async (data: OrganizationFormValues) => {
        try {
            if (organizationFormMode === "create") {
                // Use assignedProjects field if available, fall back to projects
                const projectsData = data.assignedProjects || data.projects || [];

                // Create new organization
                const organizationId = await createOrganization(data.name, projectsData);

                // Fetch the newly created organization and add to the list
                const newOrganization = await getOrganizationById(organizationId);
                if (newOrganization) {
                    setOrganizations(prevOrganizations => [
                        ...prevOrganizations,
                        newOrganization
                    ]);
                }
            } else if (organizationFormMode === "edit" && selectedOrganization) {
                // Get the organization ID directly from the form data
                const organizationId = data.id;

                if (!organizationId) {
                    throw new Error("Organization ID is missing");
                }

                // Use assignedProjects field if available, fall back to projects
                const projectsData = data.assignedProjects || data.projects || [];

                // Update the organization
                await updateOrganization(organizationId, {
                    name: data.name,
                    projectIds: projectsData,
                });

                // Refresh the organization data
                await refreshOrganizationData(organizationId);
            }

            // Close the form
            setOrganizationFormOpen(false);

            // Show success toast
            // toast({
            //     title: organizationFormMode === "create" ? t("organizationCreated") : t("organizationUpdated"),
            //     duration: 3000,
            // });

            // Notify the dashboard to refresh data
            try {
                if (dashboardStats) {
                    dashboardStats.notifyRefresh('projects');
                }
            } catch (error) {
                // Dashboard context might not be available, ignore the error
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast({
                variant: "destructive",
                title: t("formError"),
                description: t("formErrorDescription"),
            });
        }
    };

    // Toggle organization dropdown
    const toggleDropdown = (organizationId: string) => {
        if (activeDropdown === organizationId) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(organizationId);
        }
    };

    // Handle organization deletion
    const handleDeleteOrganization = async () => {
        if (!organizationToDelete) return;

        try {
            await deleteOrganization(organizationToDelete);

            // Remove organization from local state
            setOrganizations(prevOrganizations => prevOrganizations.filter(org => org.id !== organizationToDelete));

            toast({
                title: t("organizationDeleted"),
                duration: 3000,
            });

            // Notify the dashboard to refresh data
            try {
                if (dashboardStats) {
                    dashboardStats.notifyRefresh('projects');
                }
            } catch (error) {
                // Dashboard context might not be available, ignore the error
            }

            setOrganizationToDelete(null);
        } catch (error) {
            console.error("Error deleting organization:", error);
            toast({
                variant: "destructive",
                title: t("deleteError"),
                description: t("deleteErrorDescription"),
            });
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Prepare the confirmation dialog for deleting an organization
    const confirmDeleteOrganization = (organizationId: string) => {
        setOrganizationToDelete(organizationId);
        setDeleteDialogOpen(true);
        setActiveDropdown(null);
    };

    // Filter organizations based on search term
    const filteredOrganizations = organizations.filter(organization => {
        const nameEn = organization.name.en?.toLowerCase() || "";
        const nameAr = organization.name.ar?.toLowerCase() || "";
        const searchTermLower = searchTerm.toLowerCase();

        return nameEn.includes(searchTermLower) || nameAr.includes(searchTermLower);
    });

    // Skeleton component for loading state
    const CardsSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="h-60 bg-gray-200 rounded-xl w-full"></div>
                </div>
            ))}
        </div>
    );

    // Empty state component
    const EmptyState = ({ onAddOrganization }: { onAddOrganization: () => void }) => {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noOrganizationsFound")}</h3>
                <p className="text-sm text-gray-500 mb-4">{t("noOrganizationsDescription")}</p>
                <Button
                    className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white transition-colors duration-300"
                    onClick={onAddOrganization}
                >
                    <Plus size={16} className={isRtl ? "ml-2" : "mr-2"} />
                    <span>{t("addOrganization")}</span>
                </Button>
            </div>
        );
    };

    return (
        <DashboardStatsProvider>
            <div className="min-h-screen bg-gray-50" style={{ fontFamily, direction: isRtl ? 'rtl' : 'ltr' }}>
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-r from-[var(--primary-blue)] via-[var(--secondary-blue)] to-[var(--primary-green)] text-white">
                    {/* Glowing decorative background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/5 rounded-full transform -translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                        <div className="flex flex-col">
                            <div className="flex items-center mb-2">
                                <Building2 className="h-5 w-5 mr-2 opacity-80" />
                                <span className="text-sm opacity-80">{t("administration")}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("organizationManagement")}</h1>
                            <p className="text-white/80 max-w-3xl">{t("organizationManagementDescription")}</p>
                        </div>
                    </div>
                </section>

                {/* Organizations Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-white border-b pb-4 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {/* Search */}
                            <div className="relative md:w-1/3 w-full">
                                <input
                                    className="flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2  md:text-sm pl-9 bg-gray-50 border-gray-200"
                                    placeholder={t("searchOrganizations")}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>

                            <Button
                                className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white transition-colors duration-300"
                                onClick={handleAddOrganization}
                            >
                                <Plus size={16} className={isRtl ? "ml-2" : "mr-2"} />
                                <span>{t("addOrganization")}</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">


                            {/* Organizations Grid */}
                            {loading ? (
                                <CardsSkeleton />
                            ) : filteredOrganizations.length === 0 ? (
                                <EmptyState onAddOrganization={handleAddOrganization} />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                    {filteredOrganizations.map((organization) => (
                                        <motion.div
                                            key={organization.id}
                                            initial="rest"
                                            whileHover="hover"
                                            whileTap="tap"
                                            variants={cardHover}
                                            className="
                                                w-full p-5 rounded-xl relative overflow-hidden 
                                                bg-gradient-to-r from-blue-600 to-green-600
                                                hover:from-blue-500 hover:to-green-500
                                                flex flex-col
                                            "
                                        >
                                            {/* Decorative elements */}
                                            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 bg-white transform translate-x-1/3 -translate-y-1/3" />
                                            <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full opacity-10 bg-white transform -translate-x-1/3 translate-y-1/3" />

                                            {/* Main content */}
                                            <div className="flex flex-col gap-3 text-white h-full">
                                                <div>
                                                    <h2 className="text-2xl font-bold">{getLocalizedValue(organization.name, locale)}</h2>
                                                    <p className="text-sm opacity-80 mt-1">
                                                        {organization.projectIds?.length || 0} {t("assignedProjects")}
                                                    </p>
                                                </div>

                                                {/* Creation Date */}
                                                {organization.createdAt && (
                                                    <div className="flex items-center gap-1 text-sm opacity-80 mt-1">
                                                        <Calendar size={14} />
                                                        <span>{formatDate(organization.createdAt)}</span>
                                                    </div>
                                                )}

                                                {/* Project Badges */}
                                                {organization.projectIds && organization.projectIds.length > 0 && (
                                                    <div className="mt-3">
                                                        <div className="flex items-center gap-1 mb-2">
                                                            <Briefcase size={14} className="opacity-80" />
                                                            <h3 className="text-sm font-medium">{t("assignedProjects")}</h3>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 overflow-hidden max-h-20 overflow-y-auto custom-scrollbar rounded-lg">
                                                            {getOrganizationProjects(organization.projectIds).map((project) => (
                                                                <TooltipProvider key={project.id}>
                                                                    <Tooltip>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="bg-white/20 text-white hover:bg-white/30 cursor-pointer border-0 whitespace-nowrap text-xs"
                                                                        >
                                                                            {getLocalizedValue(project.name, locale)}
                                                                        </Badge>
                                                                        <TooltipContent className="max-w-[200px]">
                                                                            <p>{getLocalizedValue(project.description || {}, locale) || t("noDescription")}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action buttons */}
                                                <div className="flex justify-between items-center mt-auto pt-4">
                                                    <div className="flex items-center gap-2 text-sm opacity-80">
                                                        <Users size={16} />
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <motion.button
                                                            className="w-10 h-10 flex items-center justify-center text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleEditOrganization(organization)}
                                                            aria-label={t("editOrganization")}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </motion.button>

                                                        <motion.button
                                                            className="w-10 h-10 flex items-center justify-center text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => confirmDeleteOrganization(organization.id)}
                                                            aria-label={t("deleteOrganization")}
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

                {/* Organization Form Dialog */}
                <OrganizationFormDialog
                    open={organizationFormOpen}
                    onOpenChange={setOrganizationFormOpen}
                    mode={organizationFormMode}
                    defaultValues={selectedOrganization}
                    onSubmit={handleFormSubmit}
                />

                {/* Delete Organization Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteOrganizationConfirmation")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("deleteOrganizationWarning")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{commonT("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteOrganization}
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