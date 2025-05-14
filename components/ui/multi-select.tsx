import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type Option = {
    label: string;
    value: string;
};

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    emptyPlaceholder?: string;
    className?: string;
    badgeClassName?: string;
    disabled?: boolean;
    classNames?: {
        trigger?: string;
        badge?: string;
    };
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select options",
    emptyPlaceholder = "No options found",
    className,
    badgeClassName,
    disabled = false,
    classNames,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const locale = useLocale();
    const isRtl = locale === "ar";

    const handleUnselect = (item: string) => {
        onChange(selected.filter((i) => i !== item));
    };

    const selectables = options.filter((option) => !selected.includes(option.value));

    return (
        <Popover open={open && !disabled} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between hover:bg-transparent",
                        selected.length > 0 ? "h-auto" : "h-10",
                        disabled && "opacity-50 cursor-not-allowed",
                        isRtl && "rtl text-right",
                        classNames?.trigger,
                        className
                    )}
                    onClick={() => setOpen(!open)}
                    disabled={disabled}
                    dir={isRtl ? "rtl" : "ltr"}
                >
                    <div className={cn("flex flex-wrap gap-1 max-w-[calc(100%-20px)]", isRtl && "justify-end")}>
                        {selected.length === 0 && placeholder}
                        {selected.length > 0 && (
                            <div className="flex flex-wrap gap-1 py-0.5">
                                {selected.map((item) => {
                                    const selectedOption = options.find((option) => option.value === item);
                                    return (
                                        <Badge
                                            key={item}
                                            className={cn(
                                                "bg-[var(--primary-blue)/15] text-[var(--primary-blue)] hover:bg-[var(--primary-blue)/20] gap-1 px-1 py-0",
                                                badgeClassName,
                                                classNames?.badge
                                            )}
                                        >
                                            {selectedOption?.label || item}
                                            <Button
                                                className="h-auto p-0 text-[var(--primary-blue)] hover:text-[var(--primary-blue)] hover:bg-transparent"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnselect(item);
                                                }}
                                                disabled={disabled}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-full p-0", isRtl && "rtl")} align="start" dir={isRtl ? "rtl" : "ltr"}>
                <Command className="w-full" dir={isRtl ? "rtl" : "ltr"}>
                    <CommandInput placeholder={emptyPlaceholder} dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "rtl text-right" : ""} />
                    <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-auto">
                        {selectables.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => {
                                    onChange([...selected, option.value]);
                                    setOpen(true);
                                }}
                                className={isRtl ? "rtl justify-end" : ""}
                            >
                                <Check
                                    className={cn(
                                        "h-4 w-4",
                                        selected.includes(option.value) ? "opacity-100" : "opacity-0",
                                        isRtl ? "ml-2" : "mr-2"
                                    )}
                                />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}