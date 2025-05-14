"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle, X, Download, AlertTriangle } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import { parseExcelFile, DomainRow, importDomainsToFirestore, ImportResult, downloadDomainTemplate } from "@/lib/firestore/importDomains";

interface DomainImportExcelProps {
    frameworkId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportComplete: () => void;
}

export function DomainImportExcel({
    frameworkId,
    open,
    onOpenChange,
    onImportComplete
}: DomainImportExcelProps) {
    const t = useTranslations("DomainImport");
    const locale = useLocale();
    const isRtl = locale === "ar";

    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewData, setPreviewData] = useState<DomainRow[]>([]);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setFileName(selectedFile.name);

            // Reset states when a new file is selected
            setPreviewData([]);
            setImportResult(null);

            // Process file
            try {
                setIsLoading(true);
                const data = await parseExcelFile(selectedFile);
                setPreviewData(data);
                setStep("preview");
            } catch (error) {
                console.error("Error parsing Excel file:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const resetForm = () => {
        setFile(null);
        setFileName("");
        setPreviewData([]);
        setImportResult(null);
        setStep("upload");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleImport = async () => {
        if (!frameworkId || !previewData.length) return;

        try {
            setIsUploading(true);
            const result = await importDomainsToFirestore(frameworkId, previewData);
            setImportResult(result);
            setStep("result");

            // If import was successful or partially successful, trigger the onImportComplete callback
            if (result.successCount > 0) {
                onImportComplete();
            }
        } catch (error) {
            console.error("Error importing domains:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        downloadDomainTemplate();
    };

    const closeDialog = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const selectedFile = e.dataTransfer.files[0];
            setFile(selectedFile);
            setFileName(selectedFile.name);

            // Reset states when a new file is selected
            setPreviewData([]);
            setImportResult(null);

            // Process file
            try {
                setIsLoading(true);
                parseExcelFile(selectedFile).then(data => {
                    setPreviewData(data);
                    setStep("preview");
                    setIsLoading(false);
                }).catch(error => {
                    console.error("Error parsing Excel file:", error);
                    setIsLoading(false);
                });
            } catch (error) {
                console.error("Error parsing Excel file:", error);
                setIsLoading(false);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) resetForm();
            onOpenChange(open);
        }}>
            <DialogContent
                className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto"
                style={{ direction: isRtl ? "rtl" : "ltr" }}
                onInteractOutside={(e) => {
                    if (isLoading || isUploading) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader className="bg-gradient-to-r from-blue-600 to-green-600 -m-6 mb-6 p-6 text-white rounded-t-lg">
                    <DialogTitle className="text-xl">{t("importFromExcel")}</DialogTitle>
                    <DialogDescription className="text-white/80">
                        {t("importDescription")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {step === "upload" && (
                        <div 
                            className={`border-2 border-dashed rounded-lg p-8 text-center ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"} ${isLoading ? 'opacity-70 pointer-events-none' : 'cursor-pointer'}`}
                            onClick={triggerFileInput}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                            />

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center">
                                    <Spinner className="w-10 h-10 mx-auto mb-4" />
                                    <p className="text-lg font-medium">{t("processing")}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium mb-2">{t("dragAndDrop")}</p>
                                    <p className="text-sm text-gray-500 mb-4">{t("acceptedFormats")}</p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                triggerFileInput();
                                            }}
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            {t("selectFile")}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadTemplate();
                                            }}
                                            className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            {t("downloadTemplate")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === "preview" && previewData.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-lg">{t("previewData")}</h3>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleDownloadTemplate}
                                        size="sm"
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        {t("downloadTemplate")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setStep("upload")}
                                    >
                                        {t("changeFile")}
                                    </Button>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                            <tr>
                                                <th className="px-4 py-2 border-b">{t("domainId")}</th>
                                                <th className="px-4 py-2 border-b">{t("nameEn")}</th>
                                                <th className="px-4 py-2 border-b">{t("nameAr")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.slice(0, 5).map((row, index) => (
                                                <tr key={index} className="border-b">
                                                    <td className="px-4 py-2">
                                                        {row.domainId || <span className="text-red-500">{t("missing")}</span>}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {row.nameEn || <span className="text-red-500">{t("missing")}</span>}
                                                    </td>
                                                    <td className="px-4 py-2" dir="rtl">
                                                        {row.nameAr || <span className="text-red-500">{t("missing")}</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {previewData.length > 5 && (
                                    <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500">
                                        {t("showingPreview", { count: 5, total: previewData.length })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === "result" && importResult && (
                        <div className="py-4">
                            <div className="mb-6 text-center">
                                {importResult.success ? (
                                    <div className="bg-green-100 text-green-800 rounded-lg p-4 mb-4">
                                        <h3 className="text-lg font-semibold">{t("importSuccess")}</h3>
                                        <p>{t("importSummary", {
                                            total: importResult.totalRows,
                                            success: importResult.successCount,
                                            failed: importResult.failedCount
                                        })}</p>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-100 text-yellow-800 rounded-lg p-4 mb-4">
                                        <h3 className="text-lg font-semibold">{t("importPartial")}</h3>
                                        <p>{t("importSummary", {
                                            total: importResult.totalRows,
                                            success: importResult.successCount,
                                            failed: importResult.failedCount
                                        })}</p>
                                    </div>
                                )}
                            </div>

                            {importResult.errors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 p-3 border-b">
                                        <h3 className="font-medium text-red-800 flex items-center">
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            {t("errors")}
                                        </h3>
                                    </div>
                                    <div className="p-3 max-h-[200px] overflow-y-auto">
                                        <ul className="space-y-1">
                                            {importResult.errors.slice(0, 5).map((error, index) => (
                                                <li key={index} className="text-sm text-gray-700">{error}</li>
                                            ))}
                                            {importResult.errors.length > 5 && (
                                                <li className="text-sm text-gray-500 italic">
                                                    {t("moreErrors", { count: importResult.errors.length - 5 })}
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <Button onClick={closeDialog}>{t("close")}</Button>
                            </div>
                        </div>
                    )}
                </div>

                {step === "preview" && (
                    <DialogFooter className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeDialog}
                            disabled={isLoading || isUploading}
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={isUploading || previewData.length === 0}
                            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        >
                            {isUploading ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    {t("importing")}
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {t("import")}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
} 