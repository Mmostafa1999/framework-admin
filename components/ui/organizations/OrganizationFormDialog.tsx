"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { OrganizationFormModal, OrganizationFormValues } from "@/components/ui/organizations/OrganizationFormModal";
import { useToast } from "@/components/ui/use-toast";

interface OrganizationFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    defaultValues?: Partial<OrganizationFormValues>;
    onSubmit: (data: OrganizationFormValues) => Promise<void>;
}

export function OrganizationFormDialog({
    open,
    onOpenChange,
    mode,
    defaultValues,
    onSubmit
}: OrganizationFormDialogProps) {
    const t = useTranslations("OrganizationForm");
    const locale = useLocale();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use useCallback to prevent unnecessary re-renders
    const handleSubmit = useCallback(async (data: OrganizationFormValues) => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Ensure the ID is passed through for edit mode
            if (mode === "edit" && defaultValues?.id) {
                data.id = defaultValues.id;
            }

            // Send the data with the assignedProjects property
            await onSubmit(data);

            // Get the appropriate name based on locale (type-safe)
            const displayName = locale === "ar" ? data.name.ar : data.name.en;

            // Show success toast only after successful submission
            toast({
                title: mode === "create" ? t("organizationCreated") : t("organizationUpdated"),
                description: mode === "create"
                    ? t("organizationCreatedDescription", { name: displayName })
                    : t("organizationUpdatedDescription", { name: displayName }),
            });

            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting form:", error);
            // We don't show error toast as the parent component will handle errors
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, mode, onSubmit, onOpenChange, t, toast, defaultValues, locale]);

    return (
        <OrganizationFormModal
            open={open}
            onOpenChange={onOpenChange}
            mode={mode}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
        />
    );
} 