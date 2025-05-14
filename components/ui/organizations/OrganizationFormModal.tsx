"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
import Spinner from "@/components/ui/spinner";
import { Command } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types
export interface OrganizationFormValues {
    id?: string;
    name: {
        en: string;
        ar: string;
    };
    assignedProjects: string[]; // Primary field name used in the form
    projects?: string[]; // For backward compatibility with organization page
}

// Form schema with localized validation
const createFormSchema = (t: ReturnType<typeof useTranslations>) => z.object({
    id: z.string().optional(),
    name: z.object({
        en: z.string().min(1, { message: t("validation.requiredEnglishName") }),
        ar: z.string().min(1, { message: t("validation.requiredArabicName") }),
    }),
    assignedProjects: z.array(z.string()).default([]), // Renamed from projectIds to match requirements
});

interface Project {
    id: string;
    name: {
        en: string;
        ar: string;
    };
    description?: {
        en?: string;
        ar?: string;
    };
}

interface ProjectOption {
    value: string;
    label: string;
}

interface OrganizationFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    defaultValues?: Partial<OrganizationFormValues>;
    onSubmit: (data: OrganizationFormValues) => Promise<void>;
}

// Enhanced ProjectMultiSelect component to ensure projects are clickable
function ProjectMultiSelect({
    options,
    value,
    onChange,
    placeholder,
    emptyPlaceholder,
    disabled,
    className,
    isRtl,
}: {
    options: ProjectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder: string;
    emptyPlaceholder: string;
    disabled: boolean;
    className?: string;
    isRtl: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    // Remove a selected item
    const handleUnselect = (itemValue: string) => {
        onChange(value.filter((i) => i !== itemValue));
    };

    // Filter options based on search input
    const filteredOptions = searchValue.trim() === ""
        ? options
        : options.filter(option =>
            option.label.toLowerCase().includes(searchValue.toLowerCase())
        );

    return (
        <Popover open={open && !disabled} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between hover:bg-transparent ",
                        disabled && "opacity-50 cursor-not-allowed",
                        isRtl && "rtl text-right",
                        className
                    )}
                    onClick={() => setOpen(!open)}
                    disabled={disabled}
                    dir={isRtl ? "rtl" : "ltr"}
                >
                    <div className={cn("flex flex-wrap gap-1 max-w-[calc(100%-20px)]", isRtl && "justify-end")}>
                        {value.length === 0 && placeholder}
                        {value.length > 0 && (
                            <div className="flex flex-wrap gap-1 py-0.5">
                                {value.map((item) => {
                                    const selectedOption = options.find((option) => option.value === item);
                                    return (
                                        <Badge
                                            key={item}
                                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 gap-1 px-1 py-0"
                                        >
                                            {selectedOption?.label || item}
                                            <Button
                                                className="h-auto p-0 text-blue-800 hover:text-blue-900 hover:bg-transparent"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnselect(item);
                                                }}
                                                disabled={disabled}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn("w-full p-0", isRtl && "rtl")}
                align={isRtl ? "end" : "start"}
                dir={isRtl ? "rtl" : "ltr"}
                side="bottom"
                sideOffset={4}
            >
                <Command className="w-full" dir={isRtl ? "rtl" : "ltr"}>
                    <div className="flex items-center border-b px-3">
                        <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
                        <input
                            className={cn(
                                "flex h-10 w-full py-2 bg-transparent outline-none placeholder:text-gray-400",
                                isRtl ? "rtl text-right" : ""
                            )}
                            placeholder={placeholder}
                            dir={isRtl ? "rtl" : "ltr"}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                        {searchValue && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchValue("")}
                                className="h-auto p-0 hover:bg-transparent"
                            >
                                <X className="h-4 w-4 opacity-50" />
                            </Button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-500">
                                {emptyPlaceholder}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredOptions.map((option) => {
                                    const isSelected = value.includes(option.value);
                                    return (
                                        <div
                                            key={option.value}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer",
                                                "hover:bg-blue-50 active:bg-blue-100 transition-colors",
                                                isRtl ? "rtl text-right" : "",
                                                isSelected ? "bg-blue-50 text-blue-700 font-medium" : ""
                                            )}
                                            onClick={() => {
                                                if (isSelected) {
                                                    onChange(value.filter(val => val !== option.value));
                                                } else {
                                                    onChange([...value, option.value]);
                                                }
                                                // Keep dropdown open after selection
                                                setOpen(true);
                                            }}
                                        >
                                            <div className={cn(
                                                "flex items-center justify-center w-5 h-5 min-w-5 rounded-md border",
                                                isSelected
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-gray-300 bg-white"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </div>
                                            <span className="truncate">{option.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export function OrganizationFormModal({
    open,
    onOpenChange,
    mode = "create",
    defaultValues,
    onSubmit,
}: OrganizationFormModalProps) {
    const t = useTranslations("OrganizationForm");
    const locale = useLocale();
    const isRtl = locale === "ar";
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Projects state
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);

    // Create form schema with translations
    const formSchema = createFormSchema(t);

    // Map the projects from defaultValues to assignedProjects for compatibility
    const defaultAssignedProjects = defaultValues?.projects || defaultValues?.assignedProjects || [];

    // Set up form with react-hook-form and zod validation
    const form = useForm<OrganizationFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: defaultValues?.id,
            name: {
                en: defaultValues?.name?.en || "",
                ar: defaultValues?.name?.ar || "",
            },
            assignedProjects: defaultAssignedProjects,
        },
    });

    // When the component initializes or default values change, reset the form
    useEffect(() => {
        if (open) {
            // Map the projects from defaultValues to assignedProjects for compatibility
            const assignedProjects = defaultValues?.projects || defaultValues?.assignedProjects || [];

            form.reset({
                id: defaultValues?.id,
                name: {
                    en: defaultValues?.name?.en || "",
                    ar: defaultValues?.name?.ar || "",
                },
                assignedProjects,
            });
        }
    }, [defaultValues, form, open]);

    // Fetch projects from Firestore
    useEffect(() => {
        if (open) {
            const fetchProjects = async () => {
                setProjectsLoading(true);
                try {
                    // Get projects from Firestore
                    const projectsCollectionRef = collection(db, "projects");
                    const projectsSnapshot = await getDocs(projectsCollectionRef);

                    // Map Firestore documents to Project objects
                    const projectsList: Project[] = projectsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        name: doc.data().name || { en: "", ar: "" },
                        description: doc.data().description,
                    }));

                    setProjects(projectsList);
                } catch (error) {
                    console.error("Error fetching projects from Firestore:", error);
                } finally {
                    setProjectsLoading(false);
                }
            };

            fetchProjects();
        }
    }, [open]);

    // Map projects to options for MultiSelect based on current locale
    const projectOptions: ProjectOption[] = projects.map((project) => ({
        value: project.id,
        // Use the project name based on locale, or fallback to English name
        label: project.name?.[locale as 'en' | 'ar'] || project.name?.en || project.id,
    }));

    // Handle form submission
    const handleFormSubmit = async (data: OrganizationFormValues) => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Ensure backward compatibility with the organization page
            // The organization page expects projects but our form uses assignedProjects
            data.projects = [...data.assignedProjects];

            await onSubmit(data);
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting form:", error);
            // Parent component will handle error display
        } finally {
            setIsSubmitting(false);
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
                        {mode === "create" ? t("addOrganization") : t("editOrganization")}
                    </DialogTitle>
                    <DialogDescription className="text-white/80">
                        {mode === "create"
                            ? t("addOrganizationDescription")
                            : t("editOrganizationDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* English Name field */}
                            <FormField
                                control={form.control}
                                name="name.en"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("organizationNameEn")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} dir="ltr" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Arabic Name field */}
                            <FormField
                                control={form.control}
                                name="name.ar"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("organizationNameAr")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} dir="rtl" className="text-right" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Projects field */}
                            <FormField
                                control={form.control}
                                name="assignedProjects"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel>{t("assignedProjects")}</FormLabel>
                                        <FormControl>
                                            <ProjectMultiSelect
                                                options={projectOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder={t("selectProjects")}
                                                emptyPlaceholder={t("noProjectsFound")}
                                                disabled={projectsLoading}
                                                className={isRtl ? "rtl-select" : ""}
                                                isRtl={isRtl}
                                            />
                                        </FormControl>
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
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isSubmitting && <Spinner size="sm" className={isRtl ? "ml-2" : "mr-2"} />}
                                {isSubmitting ? t("processing") : mode === "create" ? t("submit") : t("save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}