"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { FrameworkFormModal, FrameworkFormValues } from "@/components/ui/frameworks/FrameworkFormModal";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FrameworkFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    defaultValues?: Partial<FrameworkFormValues>;
    onSubmit: (data: FrameworkFormValues) => Promise<void>;
}

export function FrameworkFormDialog({
    open,
    onOpenChange,
    mode,
    defaultValues,
    onSubmit
}: FrameworkFormDialogProps) {
    const t = useTranslations("FrameworkForm");
    const frameworkManagementT = useTranslations("FrameworkManagement");
    const locale = useLocale();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use useCallback to prevent unnecessary re-renders
    const handleSubmit = useCallback(async (data: FrameworkFormValues) => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Ensure the ID is passed through for edit mode
            if (mode === "edit" && defaultValues?.id) {
                data.id = defaultValues.id;
            }

            await onSubmit(data);

            // Show success toast only after successful submission
            toast({
                title: mode === "create" ? t("frameworkCreated") : t("frameworkUpdated"),
                description: mode === "create"
                    ? t("frameworkCreatedDescription", { name: data.name })
                    : t("frameworkUpdatedDescription", { name: data.name }),
                duration: 3000,
            });

            onOpenChange(false);
        } catch (error) {
            console.error(`Error ${mode === "create" ? "creating" : "updating"} framework:`, error);

            // Show error toast
            toast({
                variant: "destructive",
                title: mode === "create" ? "Error creating framework" : "Error updating framework",
                description: error instanceof Error ? error.message : "An unexpected error occurred",
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, mode, onSubmit, onOpenChange, t, toast, defaultValues]);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="inline-block">
                        <FrameworkFormModal
                            open={open}
                            onOpenChange={onOpenChange}
                            mode={mode}
                            defaultValues={defaultValues}
                            onSubmit={handleSubmit}
                            disabled={mode === "create"}
                            disabledNote={mode === "create" ? frameworkManagementT("frameworkAddingSoon") : undefined}
                        />
                    </div>
                </TooltipTrigger>
                {mode === "create" && (
                    <TooltipContent>
                        <p>{frameworkManagementT("frameworkAddingSoon")}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
} 