"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { UserFormModal, UserFormValues } from "@/components/ui/users/UserFormModal";
import { useToast } from "@/components/ui/use-toast";

interface UserFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    defaultValues?: Partial<UserFormValues>;
    onSubmit: (data: UserFormValues) => Promise<void>;
}

export function UserFormDialog({
    open,
    onOpenChange,
    mode,
    defaultValues,
    onSubmit
}: UserFormDialogProps) {
    const t = useTranslations("UserForm");
    const userMgmtT = useTranslations("UserManagement");
    const locale = useLocale();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use useCallback to prevent unnecessary re-renders
    const handleSubmit = useCallback(async (data: UserFormValues) => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Ensure the ID is passed through for edit mode
            if (mode === "edit" && defaultValues?.id) {
                data.id = defaultValues.id;
            }

            await onSubmit(data);

            // Success is handled in the parent component, we just close the dialog
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting form:", error);

            // Display specific error message if available
            let errorMessage = t("errorGeneric");
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast({
                title: t("errorTitle"),
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, mode, onSubmit, onOpenChange, t, userMgmtT, toast, defaultValues]);


    return (
        <UserFormModal
            open={open}
            onOpenChange={onOpenChange}
            mode={mode}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
        />
    );
}