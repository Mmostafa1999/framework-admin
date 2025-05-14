"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CapabilityLevel } from "@/hooks/useSpecifications";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/ui/spinner";
import { Specification } from "@/hooks/useSpecifications";
import { Trash2, Plus } from "lucide-react";

// Types
export interface SubSpecFormValue {
  name: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
}

export interface VersionHistoryFormValue {
  version: string;
  date: string;
  note?: {
    en: string;
    ar: string;
  };
}

export interface SpecificationFormValues {
  number: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  capabilityLevel: CapabilityLevel;
  dependency?: {
    en: string;
    ar: string;
  };
  subSpecifications?: SubSpecFormValue[];
  versionHistory?: VersionHistoryFormValue[];
}

// Form schema with localized validation
const createFormSchema = (t: ReturnType<typeof useTranslations>) => z.object({
  number: z.string().min(1, { message: t("validation.requiredSpecificationId") }),
  name: z.object({
    en: z.string().min(1, { message: t("validation.requiredEnglishName") }),
    ar: z.string().min(1, { message: t("validation.requiredArabicName") }),
  }),
  description: z.object({
    en: z.string().min(1, { message: t("validation.requiredEnglishDescription") }),
    ar: z.string().min(1, { message: t("validation.requiredArabicDescription") }),
  }),
  capabilityLevel: z.enum(["foundational", "advanced", "veryAdvanced"], {
    required_error: t("validation.requiredCapabilityLevel"),
  }),
  dependency: z.object({
    en: z.string().optional(),
    ar: z.string().optional(),
  }).optional(),
  subSpecifications: z.array(
    z.object({
      name: z.object({
        en: z.string().min(1, { message: t("validation.requiredSubSpecName") }),
        ar: z.string().min(1, { message: t("validation.requiredSubSpecName") }),
      }),
      description: z.object({
        en: z.string().optional(),
        ar: z.string().optional(),
      }).optional(),
    })
  ).optional(),
  versionHistory: z.array(
    z.object({
      version: z.string().min(1, { message: t("validation.requiredVersionNumber") }),
      date: z.string().min(1, { message: t("validation.requiredVersionDate") }),
      note: z.object({
        en: z.string().optional(),
        ar: z.string().optional(),
      }).optional(),
    })
  ).optional(),
});

interface SpecificationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  defaultValues?: Partial<SpecificationFormValues>;
  onSubmit: (data: SpecificationFormValues, originalSpecId?: string) => Promise<void>;
  existingSpecificationIds?: string[];
}

export function SpecificationFormModal({
  open,
  onOpenChange,
  mode = "create",
  defaultValues,
  onSubmit,
  existingSpecificationIds = []
}: SpecificationFormModalProps) {
  const t = useTranslations("SpecificationForm");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [isLoading, setIsLoading] = useState(false);
  const [specIdError, setSpecIdError] = useState<string | null>(null);

  // Create form schema with translations
  const formSchema = createFormSchema(t);

  // Set up form with zod validation
  const form = useForm<SpecificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: defaultValues?.number || "",
      name: {
        en: defaultValues?.name?.en || "",
        ar: defaultValues?.name?.ar || "",
      },
      description: {
        en: defaultValues?.description?.en || "",
        ar: defaultValues?.description?.ar || "",
      },
      capabilityLevel: defaultValues?.capabilityLevel || "foundational",
      dependency: defaultValues?.dependency || {
        en: "",
        ar: "",
      },
      subSpecifications: defaultValues?.subSpecifications || [],
      versionHistory: defaultValues?.versionHistory || []
    },
  });

  // Set up field arrays for sub-specifications and version history
  const { fields: subSpecFields, append: appendSubSpec, remove: removeSubSpec } =
    useFieldArray({ control: form.control, name: "subSpecifications" });

  const { fields: versionFields, append: appendVersion, remove: removeVersion } =
    useFieldArray({ control: form.control, name: "versionHistory" });

  // When the component initializes or default values change, reset the form
  useEffect(() => {
    form.reset({
      number: defaultValues?.number || "",
      name: {
        en: defaultValues?.name?.en || "",
        ar: defaultValues?.name?.ar || "",
      },
      description: {
        en: defaultValues?.description?.en || "",
        ar: defaultValues?.description?.ar || "",
      },
      capabilityLevel: defaultValues?.capabilityLevel || "foundational",
      dependency: defaultValues?.dependency || {
        en: "",
        ar: "",
      },
      subSpecifications: defaultValues?.subSpecifications || [],
      versionHistory: defaultValues?.versionHistory || []
    });
    setSpecIdError(null);
  }, [defaultValues, form, open]);

  // Add a new sub-specification
  const handleAddSubSpec = () => {
    appendSubSpec({
      name: { en: "", ar: "" },
      description: { en: "", ar: "" }
    });
  };

  // Add a new version history item
  const handleAddVersion = () => {
    appendVersion({
      version: "",
      date: new Date().toISOString().split('T')[0],
      note: { en: "", ar: "" }
    });
  };

  // Handle form submission
  const handleFormSubmit = async (data: SpecificationFormValues) => {
    // Handle specification ID uniqueness check for create mode
    if (mode === "create" && existingSpecificationIds.includes(data.number)) {
      setSpecIdError(t("validation.specificationIdExists"));
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(data, mode === "edit" ? defaultValues?.number : undefined);
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
        className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-green-600 -m-6 mb-6 p-6 text-white rounded-t-lg">
          <DialogTitle className="text-xl">
            {mode === "create" ? t("addSpecification") : t("editSpecification")}
          </DialogTitle>
          <DialogDescription className="text-white/80">
            {mode === "create" ? t("addSpecificationDescription") : t("editSpecificationDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Specification ID field - only editable in create mode */}
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>{t("specificationId")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("specificationIdPlaceholder")}
                      disabled={mode === "edit" || isLoading}
                    />
                  </FormControl>
                  {specIdError && (
                    <p className="text-sm font-medium text-red-500">
                      {specIdError}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* English Name */}
              <FormField
                control={form.control}
                name="name.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("nameEn")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("nameEnPlaceholder")}
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
                    <FormLabel>{t("nameAr")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("nameArPlaceholder")}
                        disabled={isLoading}
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* English Description */}
              <FormField
                control={form.control}
                name="description.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("descriptionEn")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("descriptionEnPlaceholder")}
                        className="min-h-[100px]"
                        disabled={isLoading}
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
                    <FormLabel>{t("descriptionAr")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("descriptionArPlaceholder")}
                        className="min-h-[100px]"
                        disabled={isLoading}
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Capability Level and Dependency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Capability Level */}
              <FormField
                control={form.control}
                name="capabilityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("capabilityLevel")}</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectLevel")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="foundational">
                          {isRtl ? "اساسيه" : "Foundational"}
                        </SelectItem>
                        <SelectItem value="advanced">
                          {isRtl ? "متقدمه" : "Advanced"}
                        </SelectItem>
                        <SelectItem value="veryAdvanced">
                          {isRtl ? "متقدمه جدا" : "Very Advanced"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* English Dependency */}
              <FormField
                control={form.control}
                name="dependency.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dependencyEn")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("dependencyEnPlaceholder")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Arabic Dependency */}
              <FormField
                control={form.control}
                name="dependency.ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dependencyAr")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("dependencyArPlaceholder")}
                        disabled={isLoading}
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sub-Specifications */}
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg">{t("subSpecifications")}</h3>
                <Button
                  type="button"
                  onClick={handleAddSubSpec}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addSubSpecification")}
                </Button>
              </div>

              {subSpecFields.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {t("addSubSpecification")}
                </div>
              ) : (
                <div className="space-y-6">
                  {subSpecFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Sub-Specification #{index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => removeSubSpec(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("removeSubSpecification")}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Sub-Spec Name (EN) */}
                        <FormField
                          control={form.control}
                          name={`subSpecifications.${index}.name.en`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("subSpecNameEn")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Sub-Spec Name (AR) */}
                        <FormField
                          control={form.control}
                          name={`subSpecifications.${index}.name.ar`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("subSpecNameAr")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isLoading}
                                  dir="rtl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Sub-Spec Description (EN) */}
                        <FormField
                          control={form.control}
                          name={`subSpecifications.${index}.description.en`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("subSpecDescriptionEn")}</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  disabled={isLoading}
                                  rows={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Sub-Spec Description (AR) */}
                        <FormField
                          control={form.control}
                          name={`subSpecifications.${index}.description.ar`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("subSpecDescriptionAr")}</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  disabled={isLoading}
                                  rows={2}
                                  dir="rtl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Version History */}
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg">{t("versionHistory")}</h3>
                <Button
                  type="button"
                  onClick={handleAddVersion}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addVersion")}
                </Button>
              </div>

              {versionFields.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {t("addVersion")}
                </div>
              ) : (
                <div className="space-y-6">
                  {versionFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Version #{index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => removeVersion(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("removeVersion")}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Version Number */}
                        <FormField
                          control={form.control}
                          name={`versionHistory.${index}.version`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("versionNumber")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={t("versionNumberPlaceholder")}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Version Date */}
                        <FormField
                          control={form.control}
                          name={`versionHistory.${index}.date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("versionDate")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="date"
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Version Note (EN) */}
                        <FormField
                          control={form.control}
                          name={`versionHistory.${index}.note.en`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("versionNoteEn")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Version Note (AR) */}
                        <FormField
                          control={form.control}
                          name={`versionHistory.${index}.note.ar`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("versionNoteAr")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isLoading}
                                  dir="rtl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white transition-colors duration-300"
                disabled={isLoading}
              >
                {isLoading && (
                  <Spinner className={isRtl ? "ml-2" : "mr-2"} />
                )}
                {mode === "create" ? t("submit") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 