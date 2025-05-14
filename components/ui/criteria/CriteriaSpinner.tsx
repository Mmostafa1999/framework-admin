import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const CriteriaSpinner: React.FC<SpinnerProps> = ({
  className,
  size = "md"
}) => {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-12 h-12"
  };

  return (
    <div className={cn(
      "rounded-full bg-gray-200 animate-pulse",
      sizeMap[size],
      className
    )}>
      <div className="h-full w-full bg-gradient-to-r from-[var(--primary-blue)] via-[var(--secondary-blue)] to-[var(--primary-green)] opacity-50 rounded-full"></div>
    </div>
  );
}; 