"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
    Search,
    Filter,
    Plus,
    Trash2,
    Pencil,
    RefreshCw,
    MoreVertical,
    User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserFormDialog } from "@/components/ui/users/UserFormDialog";
import { UserFormValues } from "@/components/UserFormModal";
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
    getAllUsers,
    getUserById,
} from "@/lib/services/userService";
import { getAllProjects } from "@/lib/services/projectService";
import { User, Project } from "@/types/firebase";

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 },
    },
};

// Role styling configuration
const roleColors = {
    Admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/20",
    Consultant: "bg-blue-100 text-blue-800 dark:bg-blue-900/20",
    Client: "bg-green-100 text-green-800 dark:bg-green-900/20"
};

export default function UsersPage() {
    const t = useTranslations("UserManagement");
    const sidebarT = useTranslations("Sidebar");
    const locale = useLocale();
    const isRtl = locale === "ar";
    const fontFamily = isRtl ? 'var(--font-cairo)' : 'var(--font-rubik)';
    const { toast } = useToast();
    const dashboardStats = useDashboardStats();

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("All Roles");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState<string | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [userFormOpen, setUserFormOpen] = useState(false);
    const [userFormMode, setUserFormMode] = useState<"create" | "edit">("create");
    const [selectedUser, setSelectedUser] = useState<Partial<UserFormValues> | undefined>(undefined);
    const [users, setUsers] = useState<User[]>([]);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectMap, setProjectMap] = useState<Record<string, string>>({});

    // Add state variable to track toast displays
    const [isFetchErrorToastShown, setIsFetchErrorToastShown] = useState(false);

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

    // Fetch users from Firestore
    useEffect(() => {
        const fetchUsersAndProjects = async () => {
            try {
                setLoading(true);

                // Fetch users
                const fetchedUsers = await getAllUsers();
                setUsers(fetchedUsers as unknown as User[]);

                // Fetch projects and create a mapping of project IDs to project names
                const projects = await getAllProjects();
                const projectMapping: Record<string, string> = {};

                projects.forEach((project: Project) => {
                    let projectName = '';

                    // Handle multilingual project names
                    if (typeof project.name === 'string') {
                        projectName = project.name;
                    } else if (project.name && typeof project.name === 'object') {
                        // Try locale-specific name first
                        projectName = project.name[locale] ||
                            // Then try English as fallback
                            project.name.en ||
                            // Then try project's default language
                            (project.defaultLang && project.name[project.defaultLang]) ||
                            // Then try first available language
                            Object.values(project.name).find(Boolean) ||
                            // Last resort: project ID
                            project.id;
                    } else {
                        projectName = project.id;
                    }

                    projectMapping[project.id] = projectName;
                });

                setProjectMap(projectMapping);

                // Reset any previous error state
                setIsFetchErrorToastShown(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                // Error handling removed as per instruction
                setIsFetchErrorToastShown(false);
            } finally {
                setLoading(false);
            }
        };

        fetchUsersAndProjects();
    }, [t, isFetchErrorToastShown, users.length, locale]);

    // Handle opening the create user form
    const handleAddUser = () => {
        setUserFormMode("create");
        setSelectedUser(undefined);
        setUserFormOpen(true);
    };

    // Handle opening the edit user form
    const handleEditUser = (user: User) => {
        setUserFormMode("edit");

        // Ensure we're passing the correct user data
        setSelectedUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as "Admin" | "Consultant" | "Client",
            status: user.status as "Active" | "Inactive",
            organization: user.organizationId || "",
            projects: user.assignedProjectIds || [],
            password: "",
            confirmPassword: "",
        });

        setUserFormOpen(true);
        setActiveDropdown(null);
    };

    // After successful update, fetch the latest user data to ensure all changes are reflected
    const refreshUserData = async (userId: string) => {
        try {
            setRefreshing(userId);
            const updatedUser = await getUserById(userId);
            if (updatedUser) {
                // Update the specific user with all latest data
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.id === userId
                            ? { ...updatedUser as unknown as User }
                            : user
                    )
                );
            }
        } catch (error) {
            console.error("Error refreshing user data:", error);
            // Continue with existing data - this is non-critical
        } finally {
            setRefreshing(null);
        }
    };

    // Handle form submission
    const handleFormSubmit = async (data: UserFormValues) => {
        try {

            if (userFormMode === "create") {
                // Create new user through the API
                if (!data.password) {
                    throw new Error("Password is required for new users");
                }

                const response = await fetch('/api/admin/create-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: data.email,
                        password: data.password,
                        name: data.name,
                        role: data.role,
                        organizationId: data.organization,
                        assignedProjectIds: data.projects,
                        status: data.status,
                        locale
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    // Specific error handling for email already exists
                    if (response.status === 409) {
                        throw new Error(t("emailAlreadyExists"));
                    }
                    throw new Error(errorData.error || 'Failed to create user');
                }

                const responseData = await response.json();
                const userId = responseData.userId;

                // Fetch the newly created user and add to the list
                const newUser = await getUserById(userId);
                if (newUser) {
                    // Convert ServiceUser to User type
                    setUsers(prevUsers => [
                        ...prevUsers,
                        newUser as unknown as User
                    ]);
                }
            } else if (userFormMode === "edit" && selectedUser) {

                // Get the user ID directly from the form data
                const userId = data.id;

                if (!userId) {
                    throw new Error("User ID is missing");
                }

                // Get the original user to check if email has been changed
                const originalUser = users.find(u => u.id === userId);

                if (!originalUser) {
                    throw new Error("User not found");
                }


                // Check if email has changed, if so handle it separately
                if (data.email !== originalUser.email) {
                    try {

                        // Use the dedicated email update endpoint
                        const emailResponse = await fetch('/api/admin/update-email', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                userId,
                                email: data.email
                            })
                        });

                        if (!emailResponse.ok) {
                            const errorData = await emailResponse.json();
                            throw new Error(errorData.error || 'Failed to update email');
                        }

                    } catch (error) {
                        console.error("Error updating email:", error);
                        throw error;
                    }
                }

                // Make the API request to update the user fields
                const response = await fetch('/api/admin/update-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId,
                        name: data.name,
                        role: data.role,
                        organizationId: data.organization,
                        assignedProjectIds: data.projects,
                        status: data.status,
                        locale
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update user');
                }


                // If password has been provided, update it separately
                if (data.password) {
                    const passwordResponse = await fetch('/api/admin/update-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            userId,
                            password: data.password
                        })
                    });

                    if (!passwordResponse.ok) {
                        const errorData = await passwordResponse.json();
                        throw new Error(errorData.error || 'Failed to update password');
                    }

                }

                // Refresh the user data after all updates
                await refreshUserData(userId);
            }

            // Close the form
            setUserFormOpen(false);

            // Show success toast
            toast({
                title: userFormMode === "create" ? t("userCreated") : t("userUpdated"),
                description: userFormMode === "create"
                    ? t("userCreatedSuccess")
                    : t("userUpdatedSuccess"),
                duration: 3000,
            });

            // Notify the dashboard to refresh data
            try {
                if (dashboardStats) {
                    dashboardStats.notifyRefresh('users');
                }
            } catch (error) {
                // Dashboard context might not be available, ignore the error
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            // Show error toast
            toast({
                title: t("Error"),
                description: error instanceof Error ? error.message : t("errorGeneric"),
                variant: "destructive",
                duration: 5000,
            });
        }
    };

    // Toggle user dropdown
    const toggleDropdown = (userId: string) => {
        if (activeDropdown === userId) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(userId);
        }
    };

    // Handle user deletion
    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const response = await fetch(`/api/admin/delete-user?userId=${userToDelete}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete user');
            }

            // Remove user from local state
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete));

            toast({
                title: t("userDeleted"),
                duration: 3000,
            });

            // Notify the dashboard to refresh data
            try {
                if (dashboardStats) {
                    dashboardStats.notifyRefresh('users');
                }
            } catch (error) {
                // Dashboard context might not be available, ignore the error
            }

            setUserToDelete(null);
        } catch (error) {
            console.error("Error deleting user:", error);
            // Handle error
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Prepare the confirmation dialog for deleting a user
    const confirmDeleteUser = (userId: string) => {
        setUserToDelete(userId);
        setDeleteDialogOpen(true);
        setActiveDropdown(null);
    };

    // Filter users based on search term and filters
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === "All Roles" || user.role === roleFilter;
        const matchesStatus = statusFilter === "All Status" || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Skeleton component for loading state
    const TableSkeleton = () => (
        <div className="animate-pulse">
            <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(160px,1fr)_minmax(120px,1fr)] gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="contents">
                        <div className="h-10 bg-gray-200 rounded px-4 py-3"></div>
                        <div className="h-10 bg-gray-200 rounded px-4 py-3"></div>
                        <div className="h-10 bg-gray-200 rounded px-4 py-3"></div>
                        <div className="h-10 bg-gray-200 rounded px-4 py-3"></div>
                        <div className="h-10 bg-gray-200 rounded px-4 py-3"></div>
                        <div className="h-10 bg-gray-200 rounded px-4 py-3"></div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Empty state component
    const EmptyState = ({ onAddUser }: { onAddUser: () => void }) => {
        const t = useTranslations("UserManagement");
        const locale = useLocale();
        const isRtl = locale === "ar";

        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <UserIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noUsersFound")}</h3>
                <p className="text-sm text-gray-500 mb-4">{t("noUsersDescription")}</p>
                <Button
                    className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white transition-colors duration-300"
                    onClick={onAddUser}
                >
                    <Plus size={16} className={isRtl ? "ml-2" : "mr-2"} />
                    <span>{t("addUser")}</span>
                </Button>
            </div>
        );
    };



    return (
        <DashboardStatsProvider>
            <div className="min-h-screen bg-gray-50" style={{ fontFamily, direction: isRtl ? 'rtl' : 'ltr' }}>
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-r from-[var(--primary-blue)] via-[var(--secondary-blue)] to-[var(--primary-green)] text-white" data-tour="users-page-overview">
                    {/* Glowing decorative background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/5 rounded-full transform -translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                        <div className="flex flex-col">
                            <div className="flex items-center mb-2">
                                <UserIcon className="h-5 w-5 mr-2 opacity-80" />
                                <span className="text-sm opacity-80">{t("administration")}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("userManagement")}</h1>
                            <p className="text-white/80 max-w-3xl">{t("createAndManageUsers")}</p>
                        </div>
                    </div>
                </section>

                {/* User Directory Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="overflow-hidden">

                        <CardContent className="p-0">
                            {/* Search and Filters */}
                            <div className="p-4 md:p-6 border-b flex flex-col md:flex-row gap-4 justify-between" data-tour="users-search-filter">
                                <div className="relative md:w-1/3 w-full">
                                    <Input
                                        type="text"
                                        placeholder={t("searchUsers")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 bg-gray-50 border-gray-200"
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center md:gap-2 gap-4 w-full">
                                    {/* Role Filter */}
                                    <div className="relative w-full md:w-auto flex-1">
                                        <select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="pl-9 pr-4 py-2 w-full bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-blue)]"
                                        >
                                            <option value="All Roles">{t("allRoles")}</option>
                                            <option value="Admin">{t("Admin")}</option>
                                            <option value="Consultant">{t("Consultant")}</option>
                                            <option value="Client">{t("Client")}</option>
                                        </select>
                                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>

                                    {/* Status Filter */}
                                    <div className="relative w-full md:w-auto flex-1">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="pl-9 pr-4 py-2 w-full bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-blue)]"
                                            data-tour="users-status-toggle"
                                        >
                                            <option value="All Status">{t("allStatus")}</option>
                                            <option value="Active">{t("Active")}</option>
                                            <option value="Inactive">{t("Inactive")}</option>
                                        </select>
                                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>

                                    {/* Add User Button */}
                                    <div className="w-full md:w-auto flex justify-end">
                                        <Button
                                            className="w-full md:w-auto bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white transition-colors duration-300"
                                            onClick={handleAddUser}
                                            data-tour="users-add-user"
                                        >
                                            <Plus size={16} className={isRtl ? "ml-2" : "mr-2"} />
                                            <span>{t("addUser")}</span>
                                        </Button>
                                    </div>
                                </div>

                            </div>

                            {/* User Table - Desktop View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <div className="min-w-[900px]">
                                    <div className={`grid grid-cols-6 gap-4 px-6 py-3 bg-gray-50 text-sm text-gray-500 ${isRtl ? 'text-right' : ''}`}
                                        style={{
                                            gridTemplateColumns: "minmax(150px, 1fr) minmax(180px, 1fr) minmax(100px, 0.8fr) minmax(100px, 0.8fr) minmax(180px, 1fr) 100px"
                                        }}>
                                        <div>{t("name")}</div>
                                        <div>{t("email")}</div>
                                        <div>{t("role")}</div>
                                        <div>{t("status")}</div>
                                        <div>{t("assignedProjects")}</div>
                                        <div className={isRtl ? "text-left" : "text-right"} data-tour="users-actions">{t("actions")}</div>
                                    </div>

                                    {loading ? (
                                        <TableSkeleton />
                                    ) : filteredUsers.length === 0 ? (
                                        <EmptyState onAddUser={handleAddUser} />
                                    ) : (
                                        <div className="divide-y">
                                            {filteredUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className={`grid grid-cols-6 gap-4 px-6 py-4 items-center ${isRtl ? 'text-right' : ''}`}
                                                    style={{
                                                        gridTemplateColumns: "minmax(150px, 1fr) minmax(180px, 1fr) minmax(100px, 0.8fr) minmax(100px, 0.8fr) minmax(180px, 1fr) 100px"
                                                    }}
                                                >
                                                    <div className="font-medium truncate" title={user.name}>{user.name}</div>
                                                    <div className="text-gray-600 truncate" title={user.email} dir="ltr">{user.email}</div>
                                                    <div>
                                                        <span className={`rounded-full px-2.5 py-0.5 text-xs leading-5 font-semibold ${roleColors[user.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
                                                            {t(user.role)}
                                                        </span>
                                                    </div>
                                                    <div data-tour="users-status-toggle">
                                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {t(user.status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {user.assignedProjectIds && user.assignedProjectIds.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {user.assignedProjectIds.slice(0, 2).map((projectId, index) => (
                                                                    <span key={index} className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-xs whitespace-nowrap">
                                                                        {projectMap[projectId] || projectId}
                                                                    </span>
                                                                ))}
                                                                {user.assignedProjectIds.length > 2 && (
                                                                    <span className="bg-gray-50 text-gray-600 rounded-full px-2 py-0.5 text-xs whitespace-nowrap">
                                                                        +{user.assignedProjectIds.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </div>
                                                    <div className={`${isRtl ? "text-left" : "text-right"} relative`}>
                                                        {refreshing === user.id ? (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="hidden lg:flex justify-end gap-1" data-tour="users-actions">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleEditUser(user)}
                                                                        className="h-8 w-8 p-0 text-gray-700 border-gray-200 hover:bg-gray-100"
                                                                        aria-label={t("editUser")}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => confirmDeleteUser(user.id)}
                                                                        className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                                                                        aria-label={t("deleteUser")}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => toggleDropdown(user.id)}
                                                                    className="h-8 w-8 p-0 lg:hidden"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {activeDropdown === user.id && (
                                                            <div
                                                                ref={dropdownRef}
                                                                className={`absolute ${isRtl ? "left-0" : "right-0"} top-full mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10`}
                                                            >
                                                                <div className="py-1">
                                                                    <button
                                                                        onClick={() => handleEditUser(user)}
                                                                        className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRtl ? "flex-row-reverse text-right" : ""}`}
                                                                    >
                                                                        <Pencil className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                                                                        {t("editUser")}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => confirmDeleteUser(user.id)}
                                                                        className={`flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 ${isRtl ? "flex-row-reverse text-right" : ""}`}
                                                                    >
                                                                        <Trash2 className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                                                                        {t("deleteUser")}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* User Cards - Mobile View */}
                            <div className="lg:hidden px-4 py-6 space-y-4">
                                {loading ? (
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="animate-pulse rounded-lg border p-4">
                                                <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
                                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                                <div className="flex space-x-2">
                                                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                                                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <EmptyState onAddUser={handleAddUser} />
                                ) : (
                                    filteredUsers.map((user) => (
                                        <motion.div
                                            key={user.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="rounded-lg border bg-white p-4 shadow-sm relative"
                                        >
                                            <div className={`absolute ${isRtl ? "left-4" : "right-4"} top-4`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleDropdown(user.id)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                                {activeDropdown === user.id && (
                                                    <div
                                                        ref={dropdownRef}
                                                        className={`absolute ${isRtl ? "left-0" : "right-0"} top-full mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10`}
                                                    >
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => handleEditUser(user)}
                                                                className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRtl ? "flex-row-reverse text-right" : ""}`}
                                                            >
                                                                <Pencil className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                                                                {t("editUser")}
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDeleteUser(user.id)}
                                                                className={`flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 ${isRtl ? "flex-row-reverse text-right" : ""}`}
                                                            >
                                                                <Trash2 className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                                                                {t("deleteUser")}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={isRtl ? "pl-8" : "pr-8"}>
                                                <div className="font-medium text-lg mb-1">{user.name}</div>
                                                <div className="text-gray-500 text-sm mb-2" dir="ltr">{user.email}</div>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={`rounded-full px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold ${roleColors[user.role as keyof typeof roleColors]} transition-colors`}>
                                                        {t(user.role)}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {t(user.status)}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <div className="font-medium mb-1">{t("assignedProjects")}:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.assignedProjectIds && user.assignedProjectIds.length > 0 ? (
                                                            user.assignedProjectIds.map((projectId, index) => (
                                                                <span key={index} className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-xs">
                                                                    {projectMap[projectId] || projectId}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">{t("noProjectsAssigned")}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* User Form Dialog */}
                <UserFormDialog
                    open={userFormOpen}
                    onOpenChange={setUserFormOpen}
                    mode={userFormMode}
                    defaultValues={selectedUser}
                    onSubmit={handleFormSubmit}
                />

                {/* Delete User Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteUserConfirmation")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("deleteUserWarning")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancelDelete")}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteUser}
                                className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                            >
                                {t("confirmDelete")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardStatsProvider>
    );
}
