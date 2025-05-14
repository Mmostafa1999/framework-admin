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
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/ui/spinner";
import { Control } from "@/hooks/useControls";

// Types
export interface ControlFormValues {
    controlId: string;
    name: {
        en: string;
        ar: string;
    };
    description: {
        en: string;
        ar: string;
    };
    dimension: "plan" | "implement" | "operate";
}

// Form schema with localized validation
const createFormSchema = (t: ReturnType<typeof useTranslations>) => z.object({
    controlId: z.string().min(1, { message: t("validation.requiredControlId") }),
    name: z.object({
        en: z.string().min(1, { message: t("validation.requiredEnglishName") }),
        ar: z.string().min(1, { message: t("validation.requiredArabicName") }),
    }),
    description: z.object({
        en: z.string().min(1, { message: t("validation.requiredEnglishDescription") }),
        ar: z.string().min(1, { message: t("validation.requiredArabicDescription") }),
    }),
    dimension: z.enum(["plan", "implement", "operate"], {
        required_error: t("validation.requiredDimension"),
    })
});

interface ControlFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    defaultValues?: Partial<ControlFormValues>;
    onSubmit: (data: ControlFormValues, controlId?: string) => Promise<void>;
    existingControlIds?: string[];
}

export function ControlFormModal({
    open,
    onOpenChange,
    mode = "create",
    defaultValues,
    onSubmit,
    existingControlIds = []
}: ControlFormModalProps) {
    const t = useTranslations("ControlForm");
    const locale = useLocale();
    const isRtl = locale === "ar";
    const [isLoading, setIsLoading] = useState(false);
    const [controlIdError, setControlIdError] = useState<string | null>(null);

    // Create form schema with translations
    const formSchema = createFormSchema(t);

    // Set up form with zod validation
    const form = useForm<ControlFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            controlId: defaultValues?.controlId || "",
            name: {
                en: defaultValues?.name?.en || "",
                ar: defaultValues?.name?.ar || "",
            },
            description: {
                en: defaultValues?.description?.en || "",
                ar: defaultValues?.description?.ar || "",
            },
            dimension: defaultValues?.dimension || "implement",
        },
    });

    // When the component initializes or default values change, reset the form
    useEffect(() => {
        form.reset({
            controlId: defaultValues?.controlId || "",
            name: {
                en: defaultValues?.name?.en || "",
                ar: defaultValues?.name?.ar || "",
            },
            description: {
                en: defaultValues?.description?.en || "",
                ar: defaultValues?.description?.ar || "",
            },
            dimension: defaultValues?.dimension || "implement",
        });
        setControlIdError(null);
    }, [defaultValues, form, open]);

    // Handle form submission
    const handleFormSubmit = async (data: ControlFormValues) => {
        // Handle control ID uniqueness check for create mode
        if (mode === "create" && existingControlIds.includes(data.controlId)) {
            setControlIdError(t("validation.controlIdExists"));
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(data, mode === "edit" ? defaultValues?.controlId : undefined);
            onOpenChange(false); // Close modal on success
        } catch (error) {
            console.error("Form submission error:", error);
        } finally {
            setIsLoading(false);
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
                        {mode === "create" ? t("addControl") : t("editControl")}
                    </DialogTitle>
                    <DialogDescription className="text-white/80">
                        {mode === "create" ? t("addControlDescription") : t("editControlDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                        {/* Control ID field - only editable in create mode */}
                        <FormField
                            control={form.control}
                            name="controlId"
                            render={({ field }) => (
                                <FormItem className="col-span-1 md:col-span-2">
                                    <FormLabel>{t("controlId")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={t("controlIdPlaceholder")}
                                            disabled={mode === "edit" || isLoading}
                                        />
                                    </FormControl>
                                    {controlIdError && (
                                        <p className="text-sm font-medium text-red-500">
                                            {controlIdError}
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* English Name */}
                            <FormField
                                control={form.control}
                                name="name.en"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("controlNameEn")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t("controlNameEnPlaceholder")}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Arabic Name */}
                            <FormField
                                control={form.control}
                                name="name.ar"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("controlNameAr")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t("controlNameArPlaceholder")}
                                                disabled={isLoading}
                                                dir="rtl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* English Description */}
                            <FormField
                                control={form.control}
                                name="description.en"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("controlDescriptionEn")}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder={t("controlDescriptionEnPlaceholder")}
                                                className="min-h-[100px]"
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Arabic Description */}
                            <FormField
                                control={form.control}
                                name="description.ar"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("controlDescriptionAr")}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder={t("controlDescriptionArPlaceholder")}
                                                className="min-h-[100px]"
                                                disabled={isLoading}
                                                dir="rtl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Dimension */}
                        <FormField
                            control={form.control}
                            name="dimension"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("dimension")}</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("selectDimension")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="plan">{t("dimensionPlan")}</SelectItem>
                                            <SelectItem value="implement">{t("dimensionImplement")}</SelectItem>
                                            <SelectItem value="operate">{t("dimensionOperate")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="mt-4"
                                disabled={isLoading}
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                className="mt-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Spinner className="mr-2 h-4 w-4" />
                                ) : null}
                                {isLoading
                                    ? t("processing")
                                    : mode === "create"
                                        ? t("submit")
                                        : t("save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 