"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import Spinner from "@/components/ui/spinner";
import { Calendar as CalendarIcon } from "lucide-react";

// Services
import { getAllOrganizations } from "@/lib/services/organizationService";
import { getAllFrameworks } from "@/lib/services/frameworkService";

// Types
import { Organization, Framework } from "@/types/firebase";
import { getLocalizedValue } from "@/types/firebase";

export interface ProjectFormValues {
    id?: string;
    name: {
        en: string;
        ar: string;
    };
    description: {
        en: string;
        ar: string;
    };
    owner: string; // Organization ID
    startDate: Date;
    projectDeadline: Date;
    status: string;
    frameworkId: string;
}

// Form schema with localized validation
const createFormSchema = (t: ReturnType<typeof useTranslations>) => z.object({
    id: z.string().optional(),
    name: z.object({
        en: z.string().min(1, { message: t("validation.requiredEnglishName") }),
        ar: z.string().min(1, { message: t("validation.requiredArabicName") }),
    }),
    description: z.object({
        en: z.string().min(1, { message: t("validation.requiredEnglishDescription") }),
        ar: z.string().min(1, { message: t("validation.requiredArabicDescription") }),
    }),
    owner: z.string().min(1, { message: t("validation.requiredOwner") }),
    startDate: z.date({ required_error: t("validation.requiredStartDate") }),
    projectDeadline: z.date({ required_error: t("validation.requiredDeadline") }),
    status: z.string().min(1, { message: t("validation.requiredStatus") }),
    frameworkId: z.string().min(1, { message: t("validation.requiredFramework") }),
});

interface ProjectFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    defaultValues?: Partial<ProjectFormValues>;
    onSubmit: (data: ProjectFormValues) => Promise<void>;
}

export function ProjectFormModal({
    open,
    onOpenChange,
    mode = "create",
    defaultValues,
    onSubmit,
}: ProjectFormModalProps) {
    const t = useTranslations("ProjectForm");
    const locale = useLocale();
    const isRtl = locale === "ar";

    // State for data
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [frameworks, setFrameworks] = useState<Framework[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create form schema with translations
    const formSchema = createFormSchema(t);

    // Set up form with zod validation
    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: {
                en: defaultValues?.name?.en || "",
                ar: defaultValues?.name?.ar || "",
            },
            description: {
                en: defaultValues?.description?.en || "",
                ar: defaultValues?.description?.ar || "",
            },
            owner: defaultValues?.owner || "",
            startDate: defaultValues?.startDate || new Date(),
            projectDeadline: defaultValues?.projectDeadline || new Date(),
            status: defaultValues?.status || "open",
            frameworkId: defaultValues?.frameworkId || "",
        },
    });

    // When the component initializes or default values change, reset the form
    useEffect(() => {
        form.reset({
            name: {
                en: defaultValues?.name?.en || "",
                ar: defaultValues?.name?.ar || "",
            },
            description: {
                en: defaultValues?.description?.en || "",
                ar: defaultValues?.description?.ar || "",
            },
            owner: defaultValues?.owner || "",
            startDate: defaultValues?.startDate || new Date(),
            projectDeadline: defaultValues?.projectDeadline || new Date(),
            status: defaultValues?.status || "open",
            frameworkId: defaultValues?.frameworkId || "",
        });
    }, [defaultValues, form]);

    // Fetch organizations from Firestore
    useEffect(() => {
        const fetchOrganizations = async () => {
            setIsLoading(true);
            try {
                const data = await getAllOrganizations();
                setOrganizations(data);
            } catch (error) {
                console.error("Error fetching organizations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrganizations();
    }, []);

    // Fetch frameworks from Firestore
    useEffect(() => {
        const fetchFrameworks = async () => {
            setIsLoading(true);
            try {
                const data = await getAllFrameworks();
                setFrameworks(data);
            } catch (error) {
                console.error("Error fetching frameworks:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFrameworks();
    }, []);

    // Handle form submission
    const handleFormSubmit = async (data: ProjectFormValues) => {
        try {
            // Convert dates to strings
            const formattedData = {
                ...data,
                startDate: format(data.startDate, "yyyy-MM-dd"),
                projectDeadline: format(data.projectDeadline, "yyyy-MM-dd"),
            };

            await onSubmit(formattedData as any);
        } catch (error) {
            console.error("Error submitting form:", error);
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
                        {mode === "create" ? t("addProject") : t("editProject")}
                    </DialogTitle>
                    <DialogDescription className="text-white/80">
                        {mode === "create"
                            ? t("addProjectDescription")
                            : t("editProjectDescription")}
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
                                        <FormLabel>{t("projectNameEn")}</FormLabel>
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
                                        <FormLabel>{t("projectNameAr")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} dir="rtl" className="text-right" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* English Description field */}
                            <FormField
                                control={form.control}
                                name="description.en"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("projectDescriptionEn")}</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} dir="ltr" className="min-h-[100px]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Arabic Description field */}
                            <FormField
                                control={form.control}
                                name="description.ar"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("projectDescriptionAr")}</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} dir="rtl" className="min-h-[100px] text-right" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Owner (Organization) field */}
                            <FormField
                                control={form.control}
                                name="owner"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("owner")}</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={isRtl ? "text-right" : ""}>
                                                    <SelectValue placeholder={t("selectOrganization")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {organizations.map((org) => (
                                                    <SelectItem key={org.id} value={org.id}>
                                                        {getLocalizedValue(org.name, locale)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Framework field */}
                            <FormField
                                control={form.control}
                                name="frameworkId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("framework")}</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={isRtl ? "text-right" : ""}>
                                                    <SelectValue placeholder={t("selectFramework")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {frameworks.map((framework) => {
                                                    // Framework name might be a string or an object
                                                    let label;
                                                    if (typeof framework.name === 'string') {
                                                        label = framework.name;
                                                    } else if (framework.name && typeof framework.name === 'object') {
                                                        label = getLocalizedValue(framework.name, locale);
                                                    } else {
                                                        label = framework.id;
                                                    }

                                                    return (
                                                        <SelectItem key={framework.id} value={framework.id}>
                                                            {label}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Start Date field */}
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t("startDate")}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={`w-full pl-3 text-left font-normal ${isRtl ? "text-right" : ""}`}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>{t("selectDate")}</span>
                                                        )}
                                                        <CalendarIcon className={`ml-auto h-4 w-4 opacity-50 ${isRtl ? "ml-0 mr-auto" : ""}`} />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Project Deadline field */}
                            <FormField
                                control={form.control}
                                name="projectDeadline"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t("projectDeadline")}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={`w-full pl-3 text-left font-normal ${isRtl ? "text-right" : ""}`}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>{t("selectDate")}</span>
                                                        )}
                                                        <CalendarIcon className={`ml-auto h-4 w-4 opacity-50 ${isRtl ? "ml-0 mr-auto" : ""}`} />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status field */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("status")}</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={isRtl ? "text-right" : ""}>
                                                    <SelectValue placeholder={t("selectStatus")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="open">{t("statusOpen")}</SelectItem>
                                                <SelectItem value="closed">{t("statusClosed")}</SelectItem>
                                                <SelectItem value="on-holding">{t("statusHold")}</SelectItem>
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