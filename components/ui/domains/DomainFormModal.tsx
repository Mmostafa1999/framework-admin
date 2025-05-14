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
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/ui/spinner";
import { Domain } from "@/hooks/useDomains";

// Types
export interface DomainFormValues {
  domainId: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  domainField: {
    en: string;
    ar: string;
  };
  defaultLang: string;
}

// Form schema with localized validation
const createFormSchema = (t: ReturnType<typeof useTranslations>) => z.object({
  domainId: z.string().min(1, { message: t("validation.requiredDomainId") }),
  name: z.object({
    en: z.string().min(1, { message: t("validation.requiredEnglishName") }),
    ar: z.string().min(1, { message: t("validation.requiredArabicName") }),
  }),
  description: z.object({
    en: z.string().min(1, { message: t("validation.requiredEnglishDescription") }),
    ar: z.string().min(1, { message: t("validation.requiredArabicDescription") }),
  }),
  domainField: z.object({
    en: z.string().min(1, { message: t("validation.requiredEnglishDomainField") }),
    ar: z.string().min(1, { message: t("validation.requiredArabicDomainField") }),
  }),
  defaultLang: z.string().default("en"),
});

interface DomainFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  defaultValues?: Partial<DomainFormValues>;
  onSubmit: (data: DomainFormValues, domainId?: string) => Promise<void>;
  existingDomainIds?: string[];
}

export function DomainFormModal({
  open,
  onOpenChange,
  mode = "create",
  defaultValues,
  onSubmit,
  existingDomainIds = []
}: DomainFormModalProps) {
  const t = useTranslations("DomainForm");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [isLoading, setIsLoading] = useState(false);
  const [domainIdError, setDomainIdError] = useState<string | null>(null);

  // Create form schema with translations
  const formSchema = createFormSchema(t);

  // Set up form with zod validation
  const form = useForm<DomainFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domainId: defaultValues?.domainId || "",
      name: {
        en: defaultValues?.name?.en || "",
        ar: defaultValues?.name?.ar || "",
      },
      description: {
        en: defaultValues?.description?.en || "",
        ar: defaultValues?.description?.ar || "",
      },
      domainField: {
        en: defaultValues?.domainField?.en || "",
        ar: defaultValues?.domainField?.ar || "",
      },
      defaultLang: defaultValues?.defaultLang || "en"
    },
  });

  // When the component initializes or default values change, reset the form
  useEffect(() => {
    form.reset({
      domainId: defaultValues?.domainId || "",
      name: {
        en: defaultValues?.name?.en || "",
        ar: defaultValues?.name?.ar || "",
      },
      description: {
        en: defaultValues?.description?.en || "",
        ar: defaultValues?.description?.ar || "",
      },
      domainField: {
        en: defaultValues?.domainField?.en || "",
        ar: defaultValues?.domainField?.ar || "",
      },
      defaultLang: defaultValues?.defaultLang || "en"
    });
    setDomainIdError(null);
  }, [defaultValues, form, open]);

  // Handle form submission
  const handleFormSubmit = async (data: DomainFormValues) => {
    // Handle domain ID uniqueness check for create mode
    if (mode === "create" && existingDomainIds.includes(data.domainId)) {
      setDomainIdError(t("validation.domainIdExists"));
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(data, mode === "edit" ? defaultValues?.domainId : undefined);
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
            {mode === "create" ? t("addDomain") : t("editDomain")}
          </DialogTitle>
          <DialogDescription className="text-white/80">
            {mode === "create" ? t("addDomainDescription") : t("editDomainDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Domain ID field - only editable in create mode */}
            <FormField
              control={form.control}
              name="domainId"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>{t("domainId")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("domainIdPlaceholder")}
                      disabled={mode === "edit" || isLoading}
                    />
                  </FormControl>
                  {domainIdError && (
                    <p className="text-sm font-medium text-red-500">
                      {domainIdError}
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
                    <FormLabel>{t("domainNameEn")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        dir="ltr"
                        placeholder={t("domainNameEnPlaceholder")}
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
                    <FormLabel>{t("domainNameAr")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        dir="rtl"
                        className="text-right"
                        placeholder={t("domainNameArPlaceholder")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* English Domain Field */}
              <FormField
                control={form.control}
                name="domainField.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("domainFieldEn")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        dir="ltr"
                        placeholder={t("domainFieldEnPlaceholder") + " (e.g. System Design, Integration)"}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Arabic Domain Field */}
              <FormField
                control={form.control}
                name="domainField.ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("domainFieldAr")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        dir="rtl"
                        className="text-right"
                        placeholder={t("domainFieldArPlaceholder") + " (مثل: تصميم النظام، التكامل)"}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description fields in their own section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* English Description */}
              <FormField
                control={form.control}
                name="description.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("domainDescriptionEn")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        dir="ltr"
                        placeholder={t("domainDescriptionEnPlaceholder")}
                        disabled={isLoading}
                        className="resize-none min-h-[80px]"
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
                    <FormLabel>{t("domainDescriptionAr")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        dir="rtl"
                        className="text-right resize-none min-h-[80px]"
                        placeholder={t("domainDescriptionArPlaceholder")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className={isRtl ? "flex-row-reverse" : ""}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Spinner className={isRtl ? "ml-2" : "mr-2"} />
                    {t("processing")}
                  </>
                ) : mode === "create" ? (
                  t("submit")
                ) : (
                  t("save")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 