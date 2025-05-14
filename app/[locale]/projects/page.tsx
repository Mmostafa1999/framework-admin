"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
    Search,
    Plus,
    Briefcase,
    Calendar,
    Clock,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProjectFormDialog } from "@/components/ui/projects/ProjectFormDialog";
import { ProjectFormValues } from "@/components/ui/projects/ProjectFormModal";
import { ProjectCard } from "@/components/ui/projects/ProjectCard";
import { ProjectFilter } from "@/components/ui/projects/ProjectFilter";
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
import { DashboardStatsProvider, useDashboardStats } from "@/context/DashboardStatsContext";

import {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectsByOrganization,
    getProjectsByStatus,
    getProjectsByFramework
} from "@/lib/services/projectService";
import { getAllOrganizations, getOrganizationById } from "@/lib/services/organizationService";
import { getAllFrameworks, getFrameworkById } from "@/lib/services/frameworkService";
import { Project, Organization, Framework } from "@/types/firebase";
import { getLocalizedValue } from "@/types/firebase";

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 },
    },
};

export default function ProjectsPage() {
    const t = useTranslations("ProjectManagement");
    const commonT = useTranslations("Common");
    const sidebarT = useTranslations("Sidebar");
    const locale = useLocale();
    const isRtl = locale === "ar";
    const fontFamily = isRtl ? 'var(--font-cairo)' : 'var(--font-rubik)';
    const { toast } = useToast();
    const dashboardStats = useDashboardStats();

    // State for projects data and UI
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [frameworks, setFrameworks] = useState<Framework[]>([]);
    const [organizationsMap, setOrganizationsMap] = useState<Map<string, Organization>>(new Map());
    const [frameworksMap, setFrameworksMap] = useState<Map<string, Framework>>(new Map());

    // State for filter options
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedOrganization, setSelectedOrganization] = useState("all");
    const [selectedFramework, setSelectedFramework] = useState("all");

    // State for modal and form management
    const [projectFormOpen, setProjectFormOpen] = useState(false);
    const [projectFormMode, setProjectFormMode] = useState<"create" | "edit">("create");
    const [selectedProject, setSelectedProject] = useState<Partial<ProjectFormValues> | undefined>(undefined);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // State for loading
    const [loading, setLoading] = useState(true);

    // Fetch projects, organizations, and frameworks on component mount
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fetch projects
                const fetchedProjects = await getAllProjects();
                setProjects(fetchedProjects);
                setFilteredProjects(fetchedProjects);

                // Fetch organizations
                const fetchedOrganizations = await getAllOrganizations();
                setOrganizations(fetchedOrganizations);

                // Create a map of organizations by ID for quick lookup
                const orgMap = new Map<string, Organization>();
                fetchedOrganizations.forEach(org => {
                    orgMap.set(org.id, org);
                });
                setOrganizationsMap(orgMap);

                // Fetch frameworks
                const fetchedFrameworks = await getAllFrameworks();
                setFrameworks(fetchedFrameworks);

                // Create a map of frameworks by ID for quick lookup
                const frameworkMap = new Map<string, Framework>();
                fetchedFrameworks.forEach(framework => {
                    frameworkMap.set(framework.id, framework);
                });
                setFrameworksMap(frameworkMap);
            } catch (error) {
                console.error("Error fetching data:", error);
                toast({
                    variant: "destructive",
                    title: t("fetchError"),
                    description: t("fetchErrorDescription"),
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [t, toast]);

    // Apply filters when search term or filter selections change
    useEffect(() => {
        const applyFilters = () => {
            let result = [...projects];

            // Apply search filter
            if (searchTerm) {
                const searchTermLower = searchTerm.toLowerCase();
                result = result.filter(project => {
                    const nameEn = project.name.en?.toLowerCase() || "";
                    const nameAr = project.name.ar?.toLowerCase() || "";
                    const descriptionEn = project.description?.en?.toLowerCase() || "";
                    const descriptionAr = project.description?.ar?.toLowerCase() || "";

                    return nameEn.includes(searchTermLower) ||
                        nameAr.includes(searchTermLower) ||
                        descriptionEn.includes(searchTermLower) ||
                        descriptionAr.includes(searchTermLower);
                });
            }

            // Apply status filter
            if (selectedStatus !== "all") {
                result = result.filter(project => project.status === selectedStatus);
            }

            // Apply organization filter
            if (selectedOrganization !== "all") {
                result = result.filter(project => project.organizationId === selectedOrganization);
            }

            // Apply framework filter
            if (selectedFramework !== "all") {
                result = result.filter(project => project.frameworkId === selectedFramework);
            }

            setFilteredProjects(result);
        };

        applyFilters();
    }, [projects, searchTerm, selectedStatus, selectedOrganization, selectedFramework]);

    // Handle opening the create project form
    const handleAddProject = () => {
        setProjectFormMode("create");
        setSelectedProject(undefined);
        setProjectFormOpen(true);
    };

    // Handle opening the edit project form
    const handleEditProject = (project: Project) => {
        // Convert date strings to Date objects for the form
        const startDate = project.startDate ? new Date(project.startDate) : new Date();
        const projectDeadline = project.projectDeadline ? new Date(project.projectDeadline) : new Date();

        setProjectFormMode("edit");
        setSelectedProject({
            id: project.id,
            name: {
                en: project.name.en || "",
                ar: project.name.ar || ""
            },
            description: {
                en: project.description.en || "",
                ar: project.description.ar || ""
            },
            owner: project.organizationId,
            startDate,
            projectDeadline,
            status: project.status,
            frameworkId: project.frameworkId
        });
        setProjectFormOpen(true);
    };

    // Handle form submission (create or edit)
    const handleFormSubmit = async (data: ProjectFormValues) => {
        try {
            if (projectFormMode === "create") {
                // Create new project
                const projectId = await createProject(
                    data.name,
                    data.description,
                    data.owner,
                    data.startDate as unknown as string,
                    data.projectDeadline as unknown as string,
                    data.status,
                    data.frameworkId,
                    "en" // Default language is always English
                );

                // Fetch the newly created project
                const newProject = await getProjectById(projectId);
                if (newProject) {
                    setProjects(prevProjects => [...prevProjects, newProject]);
                }
            } else if (projectFormMode === "edit" && selectedProject) {
                // Update the project
                const projectId = data.id as string;
                await updateProject(projectId, {
                    name: data.name,
                    description: data.description,
                    organizationId: data.owner,
                    startDate: data.startDate as unknown as string,
                    projectDeadline: data.projectDeadline as unknown as string,
                    status: data.status,
                    frameworkId: data.frameworkId,
                    defaultLang: "en" // Default language is always English
                });

                // Update the project in the local state
                setProjects(prevProjects => {
                    return prevProjects.map(project => {
                        if (project.id === projectId) {
                            return {
                                ...project,
                                name: data.name,
                                description: data.description,
                                organizationId: data.owner,
                                startDate: data.startDate as unknown as string,
                                projectDeadline: data.projectDeadline as unknown as string,
                                status: data.status,
                                frameworkId: data.frameworkId,
                                defaultLang: "en" // Default language is always English
                            };
                        }
                        return project;
                    });
                });
            }

            // Close the form modal
            setProjectFormOpen(false);




        } catch (error) {
            console.error("Error submitting project form:", error);
            toast({
                variant: "destructive",
                title: t("formError"),
                description: t("formErrorDescription"),
            });
        }
    };

    // Handle project deletion
    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            await deleteProject(projectToDelete);

            // Remove the project from local state
            setProjects(prevProjects => prevProjects.filter(project => project.id !== projectToDelete));

            toast({
                title: t("projectDeleted"),
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

            setProjectToDelete(null);
        } catch (error) {
            console.error("Error deleting project:", error);
            toast({
                variant: "destructive",
                title: t("deleteError"),
                description: t("deleteErrorDescription"),
            });
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Confirm project deletion
    const confirmDeleteProject = (projectId: string) => {
        setProjectToDelete(projectId);
        setDeleteDialogOpen(true);
    };

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
    const EmptyState = ({ onAddProject }: { onAddProject: () => void }) => {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noProjectsFound")}</h3>
                <p className="text-sm text-gray-500 mb-4">{t("noProjectsDescription")}</p>
                <Button
                    className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white transition-colors duration-300"
                    onClick={onAddProject}
                >
                    <Plus size={16} className={isRtl ? "ml-2" : "mr-2"} />
                    <span>{t("addProject")}</span>
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
                                <Briefcase className="h-5 w-5 mr-2 opacity-80" />
                                <span className="text-sm opacity-80">{t("administration")}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("projectManagement")}</h1>
                            <p className="text-white/80 max-w-3xl">{t("projectManagementDescription")}</p>
                        </div>
                    </div>
                </section>

                {/* Projects Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="overflow-hidden">
                        <CardHeader className="p-0">
                            {/* Project Filter */}
                            <ProjectFilter
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                selectedStatus={selectedStatus}
                                onStatusChange={setSelectedStatus}
                                selectedOrganization={selectedOrganization}
                                onOrganizationChange={setSelectedOrganization}
                                selectedFramework={selectedFramework}
                                onFrameworkChange={setSelectedFramework}
                                organizations={organizations}
                                frameworks={frameworks}
                            />

                            <div className="px-6 py-4 flex justify-end">
                                <Button
                                    className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white transition-colors duration-300"
                                    onClick={handleAddProject}
                                >
                                    <Plus size={16} className={isRtl ? "ml-2" : "mr-2"} />
                                    <span>{t("addProject")}</span>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Projects Grid */}
                            {loading ? (
                                <CardsSkeleton />
                            ) : filteredProjects.length === 0 ? (
                                <EmptyState onAddProject={handleAddProject} />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProjects.map((project) => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            organization={organizationsMap.get(project.organizationId) || null}
                                            framework={frameworksMap.get(project.frameworkId) || null}
                                            onEdit={handleEditProject}
                                            onDelete={confirmDeleteProject}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Project Form Dialog */}
                <ProjectFormDialog
                    open={projectFormOpen}
                    onOpenChange={setProjectFormOpen}
                    mode={projectFormMode}
                    defaultValues={selectedProject}
                    onSubmit={handleFormSubmit}
                />

                {/* Delete Project Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteProjectConfirmation")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("deleteProjectWarning")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{commonT("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteProject}
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