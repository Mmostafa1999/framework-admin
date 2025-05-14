"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { PasswordInput, PasswordStrengthIndicator } from "@/components/ui/FormComponents";
import Spinner from "@/components/ui/spinner";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";

// Define role colors - moved from UserFormModal
const ROLE_COLORS = {
    Admin: "bg-purple-100 text-purple-800",
    Consultant: "bg-blue-100 text-blue-800",
    Client: "bg-green-100 text-green-800",
};

export interface UserFormProps {
    form: any; // Using any to avoid importing react-hook-form types
    mode: "create" | "edit";
    isRtl: boolean;
    passwordStrength: number;
    showPassword: boolean;
    showConfirmPassword: boolean;
    setShowPassword: (show: boolean) => void;
    setShowConfirmPassword: (show: boolean) => void;
    projectOptions: Array<{ value: string; label: string }>;
    orgOptions: Array<{ value: string; label: string }>;
    projectsLoading: boolean;
    orgsLoading: boolean;
}

export function UserForm({
    form,
    mode,
    isRtl,
    passwordStrength,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    projectOptions,
    orgOptions,
    projectsLoading,
    orgsLoading,
}: UserFormProps) {
    // Use translations once at the component level
    const t = useTranslations("UserForm");

    return (
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
                render={({ field, fieldState }) => (
                    <FormItem>
                        <PasswordInput
                            label={mode === "create" ? t("password") : t("newPassword")}
                            placeholder={mode === "edit" ? t("leaveEmptyToKeep") : ""}
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                            showPassword={showPassword}
                            toggleShowPassword={() => setShowPassword(!showPassword)}
                        />
                        {field.value && (
                            <PasswordStrengthIndicator
                                strength={passwordStrength}
                                strengthLabel={t("passwordStrength")}
                            />
                        )}
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
                render={({ field, fieldState }) => (
                    <FormItem>
                        <PasswordInput
                            label={mode === "create" ? t("verifyPassword") : t("verifyNewPassword")}
                            placeholder={mode === "edit" ? t("leaveEmptyToKeep") : ""}
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                            showPassword={showConfirmPassword}
                            toggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
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
                rules={{ required: t("validation.required") }}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("projects")}</FormLabel>
                        <FormControl>
                            <MultiSelect
                                options={projectOptions}
                                selected={field.value || []}
                                onChange={(values) => field.onChange(values)}
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
                rules={{ required: t("validation.required") }}
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
    );
} 