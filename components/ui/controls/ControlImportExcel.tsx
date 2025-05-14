"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Control } from "@/hooks/useControls";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/ui/spinner";
import { FileSpreadsheet, Upload, AlertTriangle, FileX, Download } from "lucide-react";
import { parseExcelFile, ControlRow, importControlsToFirestore, downloadControlTemplate } from "@/lib/firestore/importControls";

interface ControlImportExcelProps {
    frameworkId: string;
    domainId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportComplete: () => void;
}

export function ControlImportExcel({
    frameworkId,
    domainId,
    open,
    onOpenChange,
    onImportComplete,
}: ControlImportExcelProps) {
    const t = useTranslations("ControlImport");
    const locale = useLocale();
    const isRtl = locale === "ar";
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<ControlRow[]>([]);
    const [importErrors, setImportErrors] = useState<{ row: number; error: string }[]>([]);
    const [importStats, setImportStats] = useState<{
        total: number;
        success: number;
        failed: number;
    } | null>(null);

    // Handle file selection
    const handleFileSelect = (newFile: File) => {
        setFile(newFile);
        parseExcelData(newFile);
    };

    // Parse Excel file
    const parseExcelData = async (file: File) => {
        setLoading(true);
        try {
            const data = await parseExcelFile(file);
            setPreviewData(data);
        } catch (error) {
            console.error("Error parsing Excel:", error);
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
            }
        }
    };

    // Reset state
    const resetState = () => {
        setFile(null);
        setPreviewData([]);
        setImportErrors([]);
        setImportStats(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Import data
    const importData = async () => {
        setLoading(true);
        setImportErrors([]);

        try {
            const result = await importControlsToFirestore(frameworkId, domainId, previewData);

            setImportStats({
                total: result.totalRows,
                success: result.successCount,
                failed: result.failedCount,
            });

            if (result.errors.length > 0) {
                setImportErrors(result.errors.map((error, index) => ({
                    row: index + 1,
                    error
                })));
            }

            if (result.successCount > 0) {
                onImportComplete();
            }
        } catch (error) {
            console.error("Error importing controls:", error);
            setImportErrors([{ row: 0, error: "Failed to import controls" }]);
        } finally {
            setLoading(false);
        }
    };

    // Handle click on browse button
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    // Handle download template
    const handleDownloadTemplate = () => {
        downloadControlTemplate();
    };

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) resetState();
            onOpenChange(open);
        }}>
            <DialogContent
                className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto"
                style={{ direction: isRtl ? "rtl" : "ltr" }}
            >
                <DialogHeader className="bg-gradient-to-r from-blue-600 to-green-600 -m-6 mb-6 p-6 text-white rounded-t-lg">
                    <DialogTitle className="text-xl">{t("importFromExcel")}</DialogTitle>
                    <DialogDescription className="text-white/80">
                        {t("importDescription")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {!file ? (
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
                            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium mb-2">{t("dragAndDrop")}</p>
                            <p className="text-sm text-gray-500 mb-4">{t("acceptedFormats")}</p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBrowseClick}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {t("selectFile")}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadTemplate}
                                    className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    {t("downloadTemplate")}
                                </Button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : loading && !previewData.length ? (
                        <div className="text-center py-8">
                            <Spinner className="w-10 h-10 mx-auto mb-4" />
                            <p className="text-lg font-medium">{t("processing")}</p>
                        </div>
                    ) : importStats ? (
                        <div className="py-4">
                            <div className="mb-6 text-center">
                                {importStats.failed === 0 ? (
                                    <div className="bg-green-100 text-green-800 rounded-lg p-4 mb-4">
                                        <h3 className="text-lg font-semibold">{t("importSuccess")}</h3>
                                        <p>{t("importSummary", importStats)}</p>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-100 text-yellow-800 rounded-lg p-4 mb-4">
                                        <h3 className="text-lg font-semibold">{t("importPartial")}</h3>
                                        <p>{t("importSummary", importStats)}</p>
                                    </div>
                                )}
                            </div>

                            {importErrors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 p-3 border-b">
                                        <h3 className="font-medium text-red-800 flex items-center">
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            {t("errors")}
                                        </h3>
                                    </div>
                                    <div className="p-3 max-h-[200px] overflow-y-auto">
                                        <ul className="space-y-1">
                                            {importErrors.slice(0, 5).map((error, index) => (
                                                <li key={index} className="text-sm text-gray-700">
                                                    <span className="font-medium">Row {error.row}:</span>{" "}
                                                    {error.error}
                                                </li>
                                            ))}
                                            {importErrors.length > 5 && (
                                                <li className="text-sm text-gray-500 italic">
                                                    {t("moreErrors", { count: importErrors.length - 5 })}
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <Button onClick={() => onOpenChange(false)}>{t("close")}</Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-4">
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
                                        onClick={resetState}
                                    >
                                        {t("changeFile")}
                                    </Button>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden mb-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                            <tr>
                                                <th className="px-4 py-2 border-b">{t("controlId")}</th>
                                                <th className="px-4 py-2 border-b">{t("nameEn")}</th>
                                                <th className="px-4 py-2 border-b">{t("nameAr")}</th>
                                                <th className="px-4 py-2 border-b">{t("dimension")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.slice(0, 5).map((row, index) => (
                                                <tr key={index} className="border-b">
                                                    <td className="px-4 py-2">{row.controlId || t("missing")}</td>
                                                    <td className="px-4 py-2">{row.nameEn || t("missing")}</td>
                                                    <td className="px-4 py-2" dir="rtl">{row.nameAr || t("missing")}</td>
                                                    <td className="px-4 py-2">
                                                        {row.dimension && ["plan", "implement", "operate"].includes(row.dimension.toLowerCase()) ? (
                                                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0">
                                                                {row.dimension.toLowerCase()}
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0">
                                                                {row.dimension || t("missing")}
                                                            </Badge>
                                                        )}
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
                </div>

                {file && previewData.length > 0 && !importStats && (
                    <DialogFooter className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={importData}
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        >
                            {loading ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    {t("importing")}
                                </>
                            ) : (
                                t("import")
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
} 