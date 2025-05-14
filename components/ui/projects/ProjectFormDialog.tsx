"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { ProjectFormModal, ProjectFormValues } from "@/components/ui/projects/ProjectFormModal";
import { useToast } from "@/components/ui/use-toast";

interface ProjectFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    defaultValues?: Partial<ProjectFormValues>;
    onSubmit: (data: ProjectFormValues) => Promise<void>;
}

export function ProjectFormDialog({
    open,
    onOpenChange,
    mode,
    defaultValues,
    onSubmit
}: ProjectFormDialogProps) {
    const t = useTranslations("ProjectForm");
    const locale = useLocale();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async (data: ProjectFormValues) => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Ensure the ID is passed through for edit mode
            if (mode === "edit" && defaultValues?.id) {
                data.id = defaultValues.id;
            }

            await onSubmit(data);

            toast({
                title: mode === "create" ? t("projectCreated") : t("projectUpdated"),
                description: mode === "create"
                    ? t("projectCreatedDescription")
                    : t("projectUpdatedDescription"),
            });

            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting form:", error);
            toast({
                variant: "destructive",
                title: t("formError") || "Error",
                description: t("formErrorDescription") || "There was an error submitting the form.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, mode, defaultValues, onSubmit, onOpenChange, t, toast]);

    return (
        <ProjectFormModal
            open={open}
            onOpenChange={onOpenChange}
            mode={mode}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
        />
    );
} 