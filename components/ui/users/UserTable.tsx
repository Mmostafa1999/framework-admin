"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User } from "@/types/firebase";
import { RefreshCw, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface UserTableProps {
    users: User[];
    isLoading: boolean;
    isRtl: boolean;
    refreshing: string | null;
    roleColors: Record<string, string>;
    projectMap?: Record<string, string>;
    onEditUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
}

// Empty state component
export const EmptyState = ({ onAddUser }: { onAddUser: () => void }) => {
    const t = useTranslations("UserManagement");

    return (
        <div className="text-center py-10">
            <div className="mb-4 mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t("noUsersYet")}</h3>
            <p className="text-gray-500 mb-4">{t("addUserDescription")}</p>
            <Button onClick={onAddUser} className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)]">
                {t("addFirstUser")}
            </Button>
        </div>
    );
};

// Loading skeleton
export const TableSkeleton = () => (
    <div className="divide-y animate-pulse">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 px-6 py-4 items-center" style={{
                gridTemplateColumns: "minmax(150px, 1fr) minmax(180px, 1fr) minmax(100px, 0.8fr) minmax(100px, 0.8fr) minmax(180px, 1fr) 100px"
            }}>
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
            </div>
        ))}
    </div>
);

export function UserTable({
    users,
    isLoading,
    isRtl,
    refreshing,
    roleColors,
    projectMap = {},
    onEditUser,
    onDeleteUser
}: UserTableProps) {
    const t = useTranslations("UserManagement");
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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

    const toggleDropdown = (userId: string) => {
        setActiveDropdown(activeDropdown === userId ? null : userId);
    };

    if (isLoading) {
        return <TableSkeleton />;
    }

    if (users.length === 0) {
        return <EmptyState onAddUser={() => { }} />;
    }

    return (
        <div className="divide-y">
            {users.map((user) => (
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
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                                        onClick={() => onEditUser(user)}
                                        className="h-8 w-8 p-0 text-gray-700 border-gray-200 hover:bg-gray-100"
                                        aria-label={t("editUser")}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDeleteUser(user.id)}
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
                                        onClick={() => onEditUser(user)}
                                        className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRtl ? "flex-row-reverse text-right" : ""}`}
                                    >
                                        <Pencil className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                                        {t("editUser")}
                                    </button>
                                    <button
                                        onClick={() => onDeleteUser(user.id)}
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
    );
} 