"use client";

import React from "react";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

// Password input component with toggle for password visibility
export const PasswordInput = ({
    label,
    placeholder,
    value,
    onChange,
    error,
    showPassword,
    toggleShowPassword,
}: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    showPassword: boolean;
    toggleShowPassword: () => void;
}) => {
    return (
        <div className="relative">
            <FormLabel>{label}</FormLabel>
            <div className="relative">
                <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={error ? "border-red-500" : ""}
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={toggleShowPassword}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                    )}
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};

// Password strength indicator component
export const PasswordStrengthIndicator = ({
    strength,
    strengthLabel,
}: {
    strength: number;
    strengthLabel: string;
}) => {
    const strengthClasses = [
        "bg-red-500",
        "bg-orange-500",
        "bg-yellow-500",
        "bg-green-500",
        "bg-emerald-500",
    ];

    return (
        <div className="mt-2">
            <span className="text-xs text-muted-foreground">{strengthLabel}</span>
            <div className="h-1 mt-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all ${strengthClasses[strength - 1] || "bg-gray-200"
                        }`}
                    style={{ width: `${(strength / 5) * 100}%` }}
                />
            </div>
        </div>
    );
}; 