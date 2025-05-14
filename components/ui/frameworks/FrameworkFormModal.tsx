"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import Spinner from "@/components/ui/spinner";

// Types
export interface FrameworkFormValues {
    id?: string;
    name: string;
    description: {
        [key: string]: string;
    };
}

// Form schema with localized validation
const createFormSchema = (t: ReturnType<typeof useTranslations>) => z.object({
    id: z.string().optional(),
    name: z.string().min(1, { message: t("validation.requiredName") }),
    description: z.record(z.string().min(1, { message: t("validation.requiredDescription") })),
});

interface FrameworkFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    defaultValues?: Partial<FrameworkFormValues>;
    onSubmit: (data: FrameworkFormValues) => Promise<void>;
    disabled?: boolean;
    disabledNote?: string;
}

export function FrameworkFormModal({
    open,
    onOpenChange,
    mode = "create",
    defaultValues,
    onSubmit,
    disabled = false,
    disabledNote
}: FrameworkFormModalProps) {
    const t = useTranslations("FrameworkForm");
    const locale = useLocale();
    const isRtl = locale === "ar";
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create form schema with translations
    const formSchema = createFormSchema(t);

    // Set up form with react-hook-form and zod validation
    const form = useForm<FrameworkFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: defaultValues?.name || "",
            description: {
                en: defaultValues?.description?.en || "",
                ar: defaultValues?.description?.ar || "",
                // Add other languages as needed
            },
        },
    });

    // When the component initializes or default values change, reset the form
    useEffect(() => {
        if (open) {
            form.reset({
                id: defaultValues?.id,
                name: defaultValues?.name || "",
                description: {
                    en: defaultValues?.description?.en || "",
                    ar: defaultValues?.description?.ar || "",
                    // Add other languages as needed
                },
            });
        }
    }, [defaultValues, form, open]);

    // Handle form submission
    const handleFormSubmit = async (data: FrameworkFormValues) => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            await onSubmit(data);
        } catch (error) {
            console.error("Error submitting framework form:", error);
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
                        {mode === "create" ? t("addFramework") : t("editFramework")}
                    </DialogTitle>
                    <DialogDescription className="text-white/80">
                        {mode === "create"
                            ? t("addFrameworkDescription")
                            : t("editFrameworkDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Name field (English only) */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("frameworkName")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} dir="ltr" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Dynamic language descriptions */}
                            <div className="space-y-4">

                                {/* English Description field */}
                                <FormField
                                    control={form.control}
                                    name="description.en"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("frameworkDescriptionEn")}</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} dir="ltr" rows={4} />
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
                                            <FormLabel>{t("frameworkDescriptionAr")}</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} dir="rtl" className="text-right" rows={4} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Additional language fields can be added here */}
                            </div>
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
                                title={disabled ? disabledNote : undefined}
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