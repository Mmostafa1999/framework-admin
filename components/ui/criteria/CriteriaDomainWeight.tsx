import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { AlertCircle, PercentIcon, BarChart4 } from "lucide-react";
import { Domain, DomainWeight } from "@/types/assessment-criteria";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

interface CriteriaDomainWeightProps {
    domains: Domain[];
    domainWeights: DomainWeight[];
    onChange: (weights: DomainWeight[]) => void;
    error?: string;
}

export const CriteriaDomainWeight: React.FC<CriteriaDomainWeightProps> = ({
    domains,
    domainWeights,
    onChange,
    error,
}) => {
    const t = useTranslations("CriteriaBuilder");
    const locale = useLocale();
    const isRtl = locale === "ar";

    const [totalWeight, setTotalWeight] = useState(0);
    const [remainingWeight, setRemainingWeight] = useState(0);

    // Calculate the remaining weight when domain weights change
    useEffect(() => {
        const total = domainWeights.reduce((sum, domain) => sum + domain.weight, 0);
        setTotalWeight(total);
        setRemainingWeight(100 - total);
    }, [domainWeights]);

    // Update a domain's weight
    const handleWeightChange = (domainId: string, weight: number) => {
        const updatedWeights = domainWeights.map((domain) =>
            domain.domainId === domainId ? { ...domain, weight } : domain
        );
        onChange(updatedWeights);
    };

    // Distribute weights evenly among all domains
    const distributeEvenly = () => {
        const equalWeight = Math.floor(100 / domains.length);
        const remainingWeight = 100 - (equalWeight * domains.length);

        const updatedWeights = domains.map((domain, index) => ({
            domainId: domain.id,
            weight: index === 0 ? equalWeight + remainingWeight : equalWeight
        }));

        onChange(updatedWeights);
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="px-1 py-4">
            <h2 className="text-2xl font-semibold mb-6 text-center">
                {t("domainWeight.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center max-w-lg mx-auto">
                {t("domainWeight.description")}
            </p>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-6 mb-8">
                <div className="flex flex-wrap items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium">
                            {t("domainWeight.weights")}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t("domainWeight.instruction")}
                        </p>
                    </div>

                    <div className="mt-4 sm:mt-0">
                        <Button
                            variant="outline"
                            onClick={distributeEvenly}
                            className="flex items-center gap-2"
                        >
                            <BarChart4 className="h-4 w-4" />
                            {t("domainWeight.distributeEvenly")}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
                    <div className="flex-grow">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div
                                className={`h-2 rounded-full ${Math.round(totalWeight) === 100
                                        ? "bg-green-500"
                                        : totalWeight > 100
                                            ? "bg-red-500"
                                            : "bg-blue-500"
                                    }`}
                                style={{ width: `${Math.min(totalWeight, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                        <PercentIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium">
                            {Math.round(totalWeight)}%
                            {Math.round(totalWeight) !== 100 && (
                                <span className={totalWeight > 100 ? "text-red-500" : "text-blue-500"}>
                                    {" "}({totalWeight > 100 ? `+${Math.round(totalWeight - 100)}` : Math.round(remainingWeight)})
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                <motion.div
                    className="space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {domains.map((domain) => {
                        const domainWeight = domainWeights.find(
                            (weight) => weight.domainId === domain.id
                        ) || { domainId: domain.id, weight: 0 };

                        return (
                            <motion.div
                                key={domain.id}
                                className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                                variants={itemVariants}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h4 className="font-medium">
                                            {domain.name[locale === "ar" ? "ar" : "en"]}
                                        </h4>
                                        <p className="text-sm text-gray-500">ID: {domain.id}</p>
                                    </div>

                                    <div className="flex items-center gap-4 sm:w-[300px]">
                                        <Slider
                                            value={[domainWeight.weight]}
                                            min={0}
                                            max={100}
                                            step={1}
                                            onValueChange={(values) =>
                                                handleWeightChange(domain.id, values[0])
                                            }
                                            className="flex-1"
                                        />
                                        <div className="w-24 flex items-center">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={domainWeight.weight}
                                                onChange={(e) =>
                                                    handleWeightChange(
                                                        domain.id,
                                                        Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                                    )
                                                }
                                                className="w-16 text-center"
                                            />
                                            <span className="ml-1">%</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}; 