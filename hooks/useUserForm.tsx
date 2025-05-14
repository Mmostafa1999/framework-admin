"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

// Define the schema type
export const createUserFormSchema = (password: string, t: any) => {
  return z.object({
    username: z.string().min(3, t("errors.minLength", { count: 3 })),
    email: z.string().email(t("errors.email")),
    password: z.string().min(8, t("errors.minLength", { count: 8 })),
    confirmPassword: z.string().refine(
      (val) => val === password,
      { message: t("errors.passwordMatch") }
    ),
    role: z.enum(["Admin", "Consultant", "Client"]),
    projects: z.array(z.string()).optional(),
    organization: z.string().optional(),
  });
};

export type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>;

interface UseUserFormProps {
  mode: "add" | "edit";
  initialValues?: Partial<UserFormValues>;
  onSubmit: (data: UserFormValues) => void;
  locale: string;
}

export function useUserForm({
  mode,
  initialValues,
  onSubmit,
  locale,
}: UseUserFormProps) {
  const t = useTranslations("UserForm");
  const [password, setPassword] = useState(initialValues?.password || "");
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Create the schema with the current password state for validation
  const schema = createUserFormSchema(password, t);
  
  // Set up form with react-hook-form and zod validation
  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: initialValues?.username || "",
      email: initialValues?.email || "",
      password: initialValues?.password || "",
      confirmPassword: initialValues?.confirmPassword || "",
      role: initialValues?.role || "Client",
      projects: initialValues?.projects || [],
      organization: initialValues?.organization || "",
    },
    mode: "onChange",
  });
  
  // Update password strength when password changes
  useEffect(() => {
    const currentPassword = form.watch("password");
    setPassword(currentPassword);
    
    // Calculate password strength
    let strength = 0;
    if (currentPassword.length > 0) strength += 1; // Has characters
    if (currentPassword.length >= 8) strength += 1; // Minimum length
    if (/[A-Z]/.test(currentPassword)) strength += 1; // Has uppercase
    if (/[0-9]/.test(currentPassword)) strength += 1; // Has numbers
    if (/[^A-Za-z0-9]/.test(currentPassword)) strength += 1; // Has special chars
    
    setPasswordStrength(strength);
  }, [form.watch("password")]);
  
  // Handle form submission
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });
  
  return {
    form,
    handleSubmit,
    passwordStrength,
    isEdit: mode === "edit",
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
  };
}
