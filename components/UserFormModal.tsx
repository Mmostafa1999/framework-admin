"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MultiSelect,
} from "@/components/ui/multi-select";
import Spinner from "@/components/ui/spinner";

// Hooks and Utilities
import { useToast } from "@/components/ui/use-toast";

// Define role colors
const ROLE_COLORS = {
    Admin: "bg-purple-100 text-purple-800",
    Consultant: "bg-blue-100 text-blue-800",
    Client: "bg-green-100 text-green-800",
};

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
    name: string;
    description?: string;
}

interface Organization {
    id: string;
    name: string;
}

interface Option {
    value: string;
    label: string;
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

    // Password visibility state
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Projects and organizations state
    const [projects, setProjects] = useState<Project[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [orgsLoading, setOrgsLoading] = useState(false);

    // Set up form with react-hook-form
    const form = useForm<UserFormValues>({
        defaultValues: {
            name: defaultValues?.name || "",
            email: defaultValues?.email || "",
            password: "", // Always empty for security
            confirmPassword: "", // Always empty for security
            role: defaultValues?.role || "Client",
            organization: defaultValues?.organization || "",
            projects: defaultValues?.projects || [],
            status: defaultValues?.status || "Active",
        },
    });

    // When the component initializes or default values change, reset the form
    useEffect(() => {
        form.reset({
            name: defaultValues?.name || "",
            email: defaultValues?.email || "",
            password: "", // Always empty for security
            confirmPassword: "", // Always empty for security
            role: defaultValues?.role || "Client",
            organization: defaultValues?.organization || "",
            projects: defaultValues?.projects || [],
            status: defaultValues?.status || "Active",
        });
    }, [defaultValues, form]);

    // Fetch projects and organizations
    useEffect(() => {
        // Fetch projects
        const fetchProjects = async () => {
            setProjectsLoading(true);
            try {
                const response = await fetch('/api/projects');
                if (response.ok) {
                    const data = await response.json();
                    setProjects(data.projects);
                }
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setProjectsLoading(false);
            }
        };

        // Fetch organizations
        const fetchOrganizations = async () => {
            setOrgsLoading(true);
            try {
                const response = await fetch('/api/organizations');
                if (response.ok) {
                    const data = await response.json();
                    setOrganizations(data.organizations);
                }
            } catch (error) {
                console.error("Error fetching organizations:", error);
            } finally {
                setOrgsLoading(false);
            }
        };

        fetchProjects();
        fetchOrganizations();
    }, []);

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
    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length > 0) strength += 1; // Has characters
        if (password.length >= 8) strength += 1; // Minimum length
        if (/[A-Z]/.test(password)) strength += 1; // Has uppercase
        if (/[0-9]/.test(password)) strength += 1; // Has numbers
        if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Has special chars

        setPasswordStrength(strength);
    };

    // Map projects to options for MultiSelect
    const projectOptions: Option[] = projects.map((project) => ({
        value: project.id,
        label: typeof project.name === 'string'
            ? project.name
            : (project.name && typeof project.name === 'object' && project.name[locale])
            || (project.name && typeof project.name === 'object' && (project.name as Record<string, string>).en)
            || '',
    }));

    // Map organizations to options for Select
    const orgOptions: Option[] = organizations.map((org) => ({
        value: org.id,
        label: typeof org.name === 'string'
            ? org.name
            : (org.name && typeof org.name === 'object' && org.name[locale])
            || (org.name && typeof org.name === 'object' && (org.name as Record<string, string>).en)
            || '',
    }));

    // Handle form submission
    const handleFormSubmit = async (data: UserFormValues) => {
        try {
            await onSubmit(data);
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting form:", error);
            toast({
                variant: "destructive",
                title: t("errorTitle"),
                description: (error as Error)?.message || t("errorGeneric"),
            });
        }
    };

    // Password strength indicator
    const renderPasswordStrength = () => {
        const strengthClasses = [
            "bg-red-500",
            "bg-orange-500",
            "bg-yellow-500",
            "bg-green-500",
            "bg-emerald-500",
        ];

        return (
            <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                    {t("passwordStrength")}
                </span>
                <div className="h-1 mt-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all ${strengthClasses[passwordStrength - 1] || "bg-gray-200"}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                </div>
            </div>
        );
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name field */}
                            <FormField
                                control={form.control}
                                name="name"
                                rules={{ required: t("validation.required") }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("userName")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Email field */}
                            <FormField
                                control={form.control}
                                name="email"
                                rules={{
                                    required: t("validation.required"),
                                    pattern: {
                                        value: /\S+@\S+\.\S+/,
                                        message: t("validation.emailInvalid")
                                    }
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("email")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="email"
                                                dir="ltr" // Email always LTR
                                                className={isRtl ? "text-left" : ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Password field */}
                            <FormField
                                control={form.control}
                                name="password"
                                rules={{
                                    required: mode === "create" ? t("validation.required") : false,
                                    minLength: {
                                        value: 8,
                                        message: t("validation.passwordMinLength")
                                    }
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{mode === "create" ? t("password") : t("newPassword")}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    type={showPassword ? "text" : "password"}
                                                    className={isRtl ? "pl-10 text-left" : "pr-10"}
                                                    dir="ltr"
                                                    placeholder={mode === "edit" ? t("leaveEmptyToKeep") : ""}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`absolute top-0 ${isRtl ? "left-0" : "right-0"} h-full px-3 py-2`}
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                    <span className="sr-only">
                                                        {showPassword ? "Hide password" : "Show password"}
                                                    </span>
                                                </Button>
                                            </div>
                                        </FormControl>
                                        {field.value && renderPasswordStrength()}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Confirm Password field */}
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                rules={{
                                    required: mode === "create" ? t("validation.required") :
                                        (form.getValues("password") ? t("validation.required") : false),
                                    validate: (value) =>
                                        !form.getValues("password") ||
                                        value === form.getValues("password") ||
                                        t("validation.passwordsMustMatch")
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{mode === "create" ? t("verifyPassword") : t("verifyNewPassword")}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className={isRtl ? "pl-10 text-left" : "pr-10"}
                                                    dir="ltr"
                                                    placeholder={mode === "edit" ? t("leaveEmptyToKeep") : ""}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`absolute top-0 ${isRtl ? "left-0" : "right-0"} h-full px-3 py-2`}
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                    <span className="sr-only">
                                                        {showConfirmPassword ? "Hide password" : "Show password"}
                                                    </span>
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Role field */}
                            <FormField
                                control={form.control}
                                name="role"
                                rules={{ required: t("validation.required") }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("role")}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("selectRole")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className={isRtl ? "text-right" : ""}>
                                                {["Admin", "Consultant", "Client"].map(role => (
                                                    <SelectItem key={role} value={role}>
                                                        <span className={`px-2 py-1 rounded text-xs ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}`}>
                                                            {t(role)}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status field */}
                            <FormField
                                control={form.control}
                                name="status"
                                rules={{ required: t("validation.required") }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("status")}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("selectStatus")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className={isRtl ? "text-right" : ""}>
                                                <SelectItem value="Active">
                                                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                                        {t("Active")}
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="Inactive">
                                                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                                                        {t("Inactive")}
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Projects field */}
                            <FormField
                                control={form.control}
                                name="projects"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("projects")}</FormLabel>
                                        <FormControl>
                                            <MultiSelect
                                                options={projectOptions}
                                                selected={field.value || []}
                                                onChange={field.onChange}
                                                placeholder={t("selectProjects")}
                                                emptyPlaceholder={t("noProjectsFound")}
                                                disabled={projectsLoading}
                                                className={isRtl ? "rtl-select" : ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Organization field */}
                            <FormField
                                control={form.control}
                                name="organization"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel>{t("organization")}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("selectOrganization")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className={isRtl ? "text-right" : ""}>
                                                {orgsLoading ? (
                                                    <div className="flex justify-center p-2">
                                                        <Spinner size="sm" />
                                                    </div>
                                                ) : (
                                                    orgOptions.map(org => (
                                                        <SelectItem key={org.value} value={org.value}>
                                                            {org.label}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                disabled={form.formState.isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {form.formState.isSubmitting && <Spinner size="sm" className={isRtl ? "ml-2" : "mr-2"} />}
                                {form.formState.isSubmitting ? t("processing") : mode === "create" ? t("submit") : t("save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
