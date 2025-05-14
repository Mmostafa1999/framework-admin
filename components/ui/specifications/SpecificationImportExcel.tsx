"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import * as XLSX from "xlsx-js-style";
import {
  generateSpecificationsTemplate,
  parseExcelFile,
  importSpecificationsToFirestore,
  SpecificationRow
} from "@/lib/firestore/importExcel";
import useSpecifications, { CapabilityLevel } from "@/hooks/useSpecifications";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/ui/spinner";
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  Download,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SpecificationImportExcelProps {
  controlId: string;
  frameworkId: string;
  domainId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

// Get localized level name
const getLocalizedLevelName = (level: CapabilityLevel | string | number, isRtl: boolean): string => {
  if (typeof level === 'string') {
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel === 'foundational') return isRtl ? "اساسيه" : "Foundational";
    if (normalizedLevel === 'advanced') return isRtl ? "متقدمه" : "Advanced";
    if (normalizedLevel === 'veryadvanced' || normalizedLevel === 'very advanced')
      return isRtl ? "متقدمه جدا" : "Very Advanced";
  }

  // Handle numeric levels (legacy support)
  if (typeof level === 'number' || !isNaN(Number(level))) {
    const numLevel = typeof level === 'number' ? level : Number(level);
    if (numLevel === 1) return isRtl ? "اساسيه" : "Foundational";
    if (numLevel === 2 || numLevel === 3) return isRtl ? "متقدمه" : "Advanced";
    if (numLevel === 4 || numLevel === 5) return isRtl ? "متقدمه جدا" : "Very Advanced";
  }

  // Default
  return isRtl ? "اساسيه" : "Foundational";
};

export function SpecificationImportExcel({
  controlId,
  frameworkId,
  domainId,
  open,
  onOpenChange,
  onImportComplete,
}: SpecificationImportExcelProps) {
  const t = useTranslations("SpecificationImport");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { importSpecifications } = useSpecifications(controlId, frameworkId, domainId);

  // States
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<SpecificationRow[]>([]);
  const [importErrors, setImportErrors] = useState<{ row: number; error: string }[]>([]);
  const [importStats, setImportStats] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Download template
  const handleDownloadTemplate = () => {
    try {
      const templateBlob = generateSpecificationsTemplate();
      const url = window.URL.createObjectURL(templateBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "specifications_template.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: t("templateDownloaded"),
        description: t("templateDownloadedDesc"),
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: t("templateError"),
        description: t("templateErrorDesc"),
        variant: "destructive",
      });
    }
  };

  // Handle file selection
  const handleFileSelect = (newFile: File) => {
    setFile(newFile);
    parseExcel(newFile);
  };

  // Parse Excel file
  const parseExcel = async (file: File) => {
    setLoading(true);
    setImportErrors([]);

    try {
      const { data, errors } = await parseExcelFile(file);

      // Set errors if any
      if (errors.length > 0) {
        setImportErrors(errors);
      }

      // Set preview data
      setPreviewData(data);

      // Show toast if needed
      if (errors.length > 0 && data.length === 0) {
        toast({
          title: t("parseError"),
          description: t("noValidData"),
          variant: "destructive",
        });
      } else if (errors.length > 0) {
        toast({
          title: t("parseWarning"),
          description: t("someRowsInvalid", { count: errors.length }),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error parsing Excel:", error);
      toast({
        title: t("parseError"),
        description: t("parseErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file)) {
        handleFileSelect(file);
      } else {
        toast({
          title: t("invalidFileType"),
          description: t("validFileTypes"),
          variant: "destructive",
        });
      }
    }
  };

  // Check if file type is valid
  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    return validTypes.includes(file.type);
  };

  // Handle file change from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isValidFileType(file)) {
        handleFileSelect(file);
      } else {
        toast({
          title: t("invalidFileType"),
          description: t("validFileTypes"),
          variant: "destructive",
        });
      }
    }
  };

  // Reset state
  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setImportErrors([]);
    setImportStats(null);
    setShowErrors(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Import data to Firestore
  const importData = async () => {
    if (previewData.length === 0) return;

    setLoading(true);

    try {
      // Use the import function from the hook if available
      if (importSpecifications) {
        // Format data for hook
        const formattedData = previewData.map(spec => ({
          number: spec.number,
          name: {
            en: spec.name_en,
            ar: spec.name_ar
          },
          description: {
            en: spec.description_en || '',
            ar: spec.description_ar || ''
          },
          dependency: {
            en: spec.dependency_en || '',
            ar: spec.dependency_ar || ''
          },
          capabilityLevel: spec.capabilityLevel as CapabilityLevel,
          // Add sub-specifications mapping
          subSpecifications: spec.subSpecs ? spec.subSpecs.map(subSpec => ({
            name: {
              en: subSpec.name_en || '',
              ar: subSpec.name_ar || ''
            },
            description: {
              en: subSpec.description_en || '',
              ar: subSpec.description_ar || ''
            }
          })) : [],
          // Add version history mapping
          versionHistory: spec.version ? [{
            version: spec.version,
            date: spec.versionDate || new Date().toISOString().split('T')[0],
            note: {
              en: spec.versionNote_en || '',
              ar: spec.versionNote_ar || ''
            }
          }] : []
        }));

        await importSpecifications(formattedData);
      } else {
        // Use the direct Firestore import as fallback
        const result = await importSpecificationsToFirestore(controlId, frameworkId, domainId, previewData);

        setImportStats({
          total: result.totalRows,
          success: result.successCount,
          failed: result.failedCount
        });

        if (result.errors.length > 0) {
          setImportErrors(result.errors);
        }

        if (result.success) {
          onImportComplete();
        }
      }

      // Set import stats
      setImportStats({
        total: previewData.length,
        success: previewData.length,
        failed: 0
      });

      // Call the complete handler
      onImportComplete();
    } catch (error) {
      console.error("Error importing specifications:", error);

      // Set import stats with failure
      setImportStats({
        total: previewData.length,
        success: 0,
        failed: previewData.length
      });

      toast({
        title: t("importError"),
        description: t("importErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetState();
      onOpenChange(newOpen);
    }}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-md md:max-w-2xl"
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-green-600 -m-6 mb-0 p-6 text-white rounded-t-lg">
          <DialogTitle className="text-xl">{t("title")}</DialogTitle>
          <DialogDescription className="text-white/80">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
            <div className="text-center">
              <Spinner className="h-8 w-8 mx-auto mb-2" />
              <p>{importStats ? t("importing") : t("processing")}</p>
            </div>
          </div>
        )}

        <div className="my-2">
          {/* File Upload View */}
          {!file && (
            <div className="p-4">
              {/* Download Template Button */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-3">{t("downloadTemplateDesc")}</p>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  className="bg-white border-[var(--primary-blue)] text-[var(--primary-blue)] hover:bg-[var(--primary-blue)]/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t("downloadTemplate")}
                </Button>
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("dragAndDropHere")}</h3>
                <p className="text-gray-500 mb-4">{t("or")}</p>
                <Button
                  onClick={handleBrowseClick}
                  className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t("browseFiles")}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = "";
                  }}
                />
              </div>
            </div>
          )}

          {/* Preview View */}
          {file && !importStats && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-medium">
                    {t("fileSelected")}: <span className="text-gray-600">{file?.name}</span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t("preview", { count: Math.min(previewData.length, 5) })}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={resetState}>
                  {t("uploadAnother")}
                </Button>
              </div>

              {/* Validation Results */}
              {importErrors.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="font-medium text-amber-700">{t("validationIssues", { count: importErrors.length })}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 p-0 h-auto"
                    onClick={() => setShowErrors(!showErrors)}
                  >
                    {showErrors ? t("hideErrors") : t("showErrors")}
                  </Button>

                  {showErrors && (
                    <div className="mt-2 max-h-40 overflow-y-auto text-sm">
                      <ul className="list-disc list-inside space-y-1">
                        {importErrors.slice(0, 10).map((error, idx) => (
                          <li key={idx} className="text-gray-700">
                            {t("rowError", { row: error.row, error: error.error })}
                          </li>
                        ))}
                        {importErrors.length > 10 && (
                          <li className="text-gray-700">
                            {t("moreErrors", { count: importErrors.length - 10 })}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Table */}
              {previewData.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-2">{t("preview")}</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="py-2 px-4 text-left font-medium">{t("number")}</th>
                          <th className="py-2 px-4 text-left font-medium">{t("name")}</th>
                          <th className="py-2 px-4 text-left font-medium">{t("level")}</th>
                          <th className="py-2 px-4 text-left font-medium">{t("subspecs")}</th>
                          <th className="py-2 px-4 text-left font-medium">{t("version")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/50"}>
                            <td className="py-2 px-4 border-t">{item.number}</td>
                            <td className="py-2 px-4 border-t">{isRtl ? item.name_ar : item.name_en}</td>
                            <td className="py-2 px-4 border-t">
                              {getLocalizedLevelName(item.capabilityLevel, isRtl)}
                            </td>
                            <td className="py-2 px-4 border-t">
                              {item.subSpecs && item.subSpecs.length > 0 ? (
                                <Badge variant="outline">
                                  {item.subSpecs.length} {t("subsFound")}
                                </Badge>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="py-2 px-4 border-t">
                              {item.version ? (
                                <Badge variant="outline">{item.version}</Badge>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results View */}
          {importStats && (
            <div className="p-4">
              <div className="text-center mb-6">
                {importStats.failed === 0 ? (
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 mb-4">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                ) : importStats.success === 0 ? (
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600 mb-4">
                    <XCircle className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 text-amber-600 mb-4">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                )}

                <h3 className="text-lg font-medium">{t("importComplete")}</h3>
                <p className="text-gray-600 mt-1">
                  {importStats && t("importStats", { success: importStats.success, failed: importStats.failed })}
                </p>
              </div>

              {importErrors.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="font-medium text-amber-700">{t("importErrors", { count: importErrors.length })}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 p-0 h-auto"
                    onClick={() => setShowErrors(!showErrors)}
                  >
                    {showErrors ? t("hideErrors") : t("showErrors")}
                  </Button>

                  {showErrors && (
                    <div className="mt-2 max-h-40 overflow-y-auto text-sm">
                      <ul className="list-disc list-inside space-y-1">
                        {importErrors.slice(0, 10).map((error, idx) => (
                          <li key={idx} className="text-gray-700">
                            {t("rowError", { row: error.row, error: error.error })}
                          </li>
                        ))}
                        {importErrors.length > 10 && (
                          <li className="text-gray-700">
                            {t("moreErrors", { count: importErrors.length - 10 })}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!file && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
            </>
          )}

          {file && !importStats && (
            <>
              <Button variant="outline" onClick={resetState} disabled={loading}>
                {t("cancel")}
              </Button>
              <Button
                onClick={importData}
                disabled={loading || previewData.length === 0}
                className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)]"
              >
                {t("importNow")}
              </Button>
            </>
          )}

          {importStats && (
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)]"
            >
              {t("done")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
