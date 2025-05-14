"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
} from "@/components/ui/form";
import Spinner from "@/components/ui/spinner";

// Form Components
import { UserForm } from "@/components/ui/users/UserForm";

// Hooks and Utilities
import { useToast } from "@/components/ui/use-toast";
import { getAllProjects } from "@/lib/services/projectService";
import { getAllOrganizations } from "@/lib/services/organizationService";

export interface UserFormValues {
    id?: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: "Admin" | "Consultant" | "Client";
    organization: string;
    projects: string[];
    status: "Active" | "Inactive";
}

interface Project {
    id: string;
    name: Record<string, string> | string;
    description?: Record<string, string> | string;
}

interface Organization {
    id: string;
    name: Record<string, string> | string;
}

interface Option {
    value: string;
    label: string;
}

// Form state interface for better state management
interface FormState {
    passwordVisibility: {
        showPassword: boolean;
        showConfirmPassword: boolean;
        strength: number;
    };
    resources: {
        projects: Project[];
        organizations: Organization[];
        isLoading: {
            projects: boolean;
            organizations: boolean;
        };
    };
}

interface UserFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    defaultValues?: Partial<UserFormValues>;
    onSubmit: (data: UserFormValues) => Promise<void>;
}

export function UserFormModal({
    open,
    onOpenChange,
    mode = "create",
    defaultValues,
    onSubmit,
}: UserFormModalProps) {
    const t = useTranslations("UserForm");
    const locale = useLocale();
    const isRtl = locale === "ar";
    const { toast } = useToast();

    // Consolidated form state
    const [formState, setFormState] = useState<FormState>({
        passwordVisibility: {
            showPassword: false,
            showConfirmPassword: false,
            strength: 0,
        },
        resources: {
            projects: [],
            organizations: [],
            isLoading: {
                projects: false,
                organizations: false,
            },
        },
    });

    // Create validation schema based on mode
    const createUserSchema = z.object({
        name: z.string().min(2, t("validation.nameMinLength")),
        email: z.string().email(t("validation.emailInvalid")),
        password: z.string()
            .min(8, t("validation.passwordMinLength"))
            .refine(val => /[A-Z]/.test(val), { message: t("validation.passwordRequiresUppercase") })
            .refine(val => /[0-9]/.test(val), { message: t("validation.passwordRequiresNumber") }),
        confirmPassword: z.string(),
        role: z.enum(["Admin", "Consultant", "Client"]),
        organization: z.string().min(1, t("validation.required")),
        projects: z.array(z.string()).min(1, t("validation.required")),
        status: z.enum(["Active", "Inactive"]),
    }).refine(data => data.password === data.confirmPassword, {
        message: t("validation.passwordsMustMatch"),
        path: ['confirmPassword'],
    });

    const editUserSchema = z.object({
        id: z.string(),
        name: z.string().min(2, t("validation.nameMinLength")),
        email: z.string().email(t("validation.emailInvalid")),
        // Password is optional for edit
        password: z.string()
            .refine(val => val === '' || val.length >= 8, t("validation.passwordMinLength"))
            .refine(val => val === '' || /[A-Z]/.test(val), t("validation.passwordRequiresUppercase"))
            .refine(val => val === '' || /[0-9]/.test(val), t("validation.passwordRequiresNumber"))
            .optional(),
        confirmPassword: z.string().optional(),
        role: z.enum(["Admin", "Consultant", "Client"]),
        organization: z.string().min(1, t("validation.required")),
        projects: z.array(z.string()).min(1, t("validation.required")),
        status: z.enum(["Active", "Inactive"]),
    }).refine(data => data.password === data.confirmPassword, {
        message: t("validation.passwordsMustMatch"),
        path: ['confirmPassword'],
    });

    // Choose schema based on mode
    const formSchema = mode === "create" ? createUserSchema : editUserSchema;

    // Set up form with react-hook-form and zod validation
    const form = useForm<UserFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: defaultValues?.name || "",
            email: defaultValues?.email || "",
            password: "", // Always empty for security
            confirmPassword: "", // Always empty for security
            role: defaultValues?.role || "Client",
            organization: defaultValues?.organization || "",
            projects: Array.isArray(defaultValues?.projects) ? defaultValues.projects : [],
            status: defaultValues?.status || "Active",
        },
    });

    // When the component initializes or default values change, reset the form
    useEffect(() => {
        form.reset({
            id: defaultValues?.id,
            name: defaultValues?.name || "",
            email: defaultValues?.email || "",
            password: "", // Always empty for security
            confirmPassword: "", // Always empty for security
            role: defaultValues?.role || "Client",
            organization: defaultValues?.organization || "",
            projects: Array.isArray(defaultValues?.projects) ? defaultValues.projects : [],
            status: defaultValues?.status || "Active",
        });
    }, [defaultValues, form]);

    // Toggle password visibility
    const togglePasswordVisibility = useCallback((field: 'password' | 'confirmPassword') => {
        setFormState(prev => ({
            ...prev,
            passwordVisibility: {
                ...prev.passwordVisibility,
                [field === 'password' ? 'showPassword' : 'showConfirmPassword']:
                    !prev.passwordVisibility[field === 'password' ? 'showPassword' : 'showConfirmPassword']
            }
        }));
    }, []);

    // Fetch projects with better error handling
    const fetchProjects = useCallback(async () => {
        setFormState(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                isLoading: {
                    ...prev.resources.isLoading,
                    projects: true,
                }
            }
        }));

        try {
            // Use the projectService to fetch projects directly from Firebase
            const projects = await getAllProjects();

            const processedProjects = projects.map(project => ({
                id: project.id,
                name: project.name || '',
                description: project.description || ''
            }));

            setFormState(prev => ({
                ...prev,
                resources: {
                    ...prev.resources,
                    projects: processedProjects,
                    isLoading: {
                        ...prev.resources.isLoading,
                        projects: false,
                    }
                }
            }));
        } catch (error) {
            console.error("Error fetching projects:", error);

            // Remove toast notification but still update loading state
            setFormState(prev => ({
                ...prev,
                resources: {
                    ...prev.resources,
                    isLoading: {
                        ...prev.resources.isLoading,
                        projects: false,
                    }
                }
            }));
        }
    }, [locale]);

    // Fetch organizations with better error handling
    const fetchOrganizations = useCallback(async () => {
        setFormState(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                isLoading: {
                    ...prev.resources.isLoading,
                    organizations: true,
                }
            }
        }));

        try {
            // Use the organizationService to fetch organizations directly from Firebase
            const organizations = await getAllOrganizations();

            const processedOrganizations = organizations.map(org => ({
                id: org.id,
                name: org.name
            }));

            setFormState(prev => ({
                ...prev,
                resources: {
                    ...prev.resources,
                    organizations: processedOrganizations,
                    isLoading: {
                        ...prev.resources.isLoading,
                        organizations: false,
                    }
                }
            }));
        } catch (error) {
            console.error("Error fetching organizations:", error);

            // Remove toast notification but still update loading state
            setFormState(prev => ({
                ...prev,
                resources: {
                    ...prev.resources,
                    isLoading: {
                        ...prev.resources.isLoading,
                        organizations: false,
                    }
                }
            }));
        }
    }, [locale]);

    // Fetch resources on component mount
    useEffect(() => {
        fetchProjects();
        fetchOrganizations();
    }, [fetchProjects, fetchOrganizations]);

    // Watch the password field to calculate strength
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'password') {
                const password = value.password as string || '';
                calculatePasswordStrength(password);
            }
        });

        return () => subscription.unsubscribe();
    }, [form.watch]);

    // Calculate password strength
    const calculatePasswordStrength = useCallback((password: string) => {
        let strength = 0;
        if (password.length > 0) strength += 1; // Has characters
        if (password.length >= 8) strength += 1; // Minimum length
        if (/[A-Z]/.test(password)) strength += 1; // Has uppercase
        if (/[0-9]/.test(password)) strength += 1; // Has numbers
        if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Has special chars

        setFormState(prev => ({
            ...prev,
            passwordVisibility: {
                ...prev.passwordVisibility,
                strength,
            }
        }));
    }, []);

    // Map projects to options for MultiSelect
    const projectOptions: Option[] = formState.resources.projects
        .filter(project => project.id && (typeof project.name === 'string' ? project.name : true))
        .map((project) => {
            let label = '';

            if (typeof project.name === 'string') {
                label = project.name;
            } else if (project.name && typeof project.name === 'object') {
                // Try locale-specific name first
                label = project.name[locale] ||
                    // Then try English as fallback
                    project.name.en ||
                    // Then try first available language
                    Object.values(project.name).find(Boolean) ||
                    // Last resort: project ID
                    project.id;
            } else {
                label = project.id;
            }

            return {
                value: project.id,
                label
            };
        });


    // Map organizations to options for Select
    const orgOptions: Option[] = formState.resources.organizations.map((org) => {
        let label = '';

        if (typeof org.name === 'string') {
            label = org.name;
        } else if (org.name && typeof org.name === 'object') {
            // Try locale-specific name first
            label = org.name[locale] ||
                // Then try English as fallback
                org.name.en ||
                // Then try first available language
                Object.values(org.name).find(Boolean) ||
                // Last resort: organization ID
                org.id;
        } else {
            label = org.id;
        }

        return {
            value: org.id,
            label
        };
    });


    // Handle form submission with better error handling
    const handleFormSubmit = async (data: UserFormValues) => {
        try {

            await onSubmit(data);
            // Just close the dialog, let parent handle success messages
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting form:", error);
            // Error is handled by the parent component
            throw error;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-[95vw] md:max-w-2xl"
                style={{ direction: isRtl ? "rtl" : "ltr" }}
            >
                <DialogHeader className="bg-gradient-to-r from-blue-600 to-green-600 -m-6 mb-6 p-6 text-white rounded-t-lg">
                    <DialogTitle className="text-xl">
                        {mode === "create" ? t("addUser") : t("editUser")}
                    </DialogTitle>
                    <DialogDescription className="text-white/80">
                        {mode === "create"
                            ? t("addUserDescription")
                            : t("editUserDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                        <UserForm
                            form={form}
                            mode={mode}
                            isRtl={isRtl}
                            passwordStrength={formState.passwordVisibility.strength}
                            showPassword={formState.passwordVisibility.showPassword}
                            showConfirmPassword={formState.passwordVisibility.showConfirmPassword}
                            setShowPassword={() => togglePasswordVisibility('password')}
                            setShowConfirmPassword={() => togglePasswordVisibility('confirmPassword')}
                            projectOptions={projectOptions}
                            orgOptions={orgOptions}
                            projectsLoading={formState.resources.isLoading.projects}
                            orgsLoading={formState.resources.isLoading.organizations}
                        />

                        <DialogFooter className={isRtl ? "flex-row-reverse" : ""}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white transition-colors duration-300"
                            >
                                {form.formState.isSubmitting && (
                                    <Spinner className={isRtl ? "ml-2" : "mr-2"} />
                                )}
                                {mode === "create" ? t("addUser") : t("save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
