'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import Image from 'next/image';

import { useAuthContext } from '@/context/AuthContext';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function LoginPage() {
    const t = useTranslations('Auth');
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const fontFamily = isRtl ? 'var(--font-cairo)' : 'var(--font-rubik)';
    const { login, error } = useAuthContext();

    // Use a separate loading state for the button
    const [buttonLoading, setButtonLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple form validation
        if (!email.trim()) {
            setFormError(t('validation.emailRequired'));
            setFormState("error");
            return;
        }

        if (!password.trim()) {
            setFormError(t('validation.passwordRequired'));
            setFormState("error");
            return;
        }

        // Clear previous errors
        setFormError(null);
        // Set loading state and form state
        setButtonLoading(true);
        setFormState("submitting");

        try {
            console.log('Attempting login...');
            // Use the login function from AuthContext
            await login(email, password);
            console.log('Login successful, updating form state');
            setFormState("success");
            // Button loading state will be maintained during redirect
        } catch (error) {
            console.error('Login submission error:', error);

            // Handle specific error messages
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            if (errorMessage.includes('auth/user-not-found') ||
                errorMessage.includes('auth/wrong-password') ||
                errorMessage.includes('auth/invalid-credential')) {
                setFormError(t('invalidCredentials'));
            } else if (errorMessage.includes('auth/too-many-requests')) {
                setFormError(t('tooManyAttempts'));
            } else if (errorMessage.includes('User not found in database')) {
                setFormError(t('userNotInDatabase'));
            } else if (errorMessage.includes('network-request-failed')) {
                setFormError(t('networkError'));
            } else {
                // Use the error from the hook or a generic message
                setFormError(errorMessage || t('serverError'));
            }

            setFormState("error");
            // Reset loading state if login fails
            setButtonLoading(false);
        }
    };

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: {
                duration: 0.3
            }
        }
    };

    const slideIn = {
        hidden: { x: -60, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    const formControls = {
        hidden: { opacity: 0 },
        visible: (custom: number) => ({
            opacity: 1,
            transition: {
                delay: custom * 0.1 + 0.3,
                duration: 0.6
            }
        })
    };

    const buttonVariants = {
        idle: { scale: 1 },
        hover: { scale: 1.03, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" },
        tap: { scale: 0.98 },
        loading: {
            scale: 1,
            boxShadow: "0 0 0 rgba(0, 0, 0, 0)"
        }
    };

    const loadingSpinner = {
        animate: {
            rotate: 360,
            transition: {
                duration: 1,
                repeat: Infinity,
                ease: "linear"
            }
        }
    };

    return (
        <div
            className="flex min-h-screen bg-white"
            dir={isRtl ? 'rtl' : 'ltr'}
            style={{ fontFamily }}
        >
            {/* Language switcher in top-right corner */}
            <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-20`}>
                <LanguageSwitcher className="text-brand-primary hover:bg-white/20" />
            </div>

            {/* Left side image (70%) */}
            <motion.div
                className="hidden lg:block w-[70%] relative bg-[#45cab0] overflow-hidden"
                initial="hidden"
                animate="visible"
                variants={slideIn}
            >
                <Image
                    src="/assets/SideIMage.png"
                    alt="DevFlow AI Planning"
                    fill
                    style={{ objectFit: "cover" }}
                    priority
                    className={`${isRtl ? 'rounded-l-xl' : 'rounded-r-xl'}`}
                />
                <div className={`absolute inset-0 bg-[#45cab0]/30 ${isRtl ? 'rounded-l-xl' : 'rounded-r-xl'} mix-blend-multiply`} />
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#45cab0]/70"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                />
                <div className={`absolute bottom-10 ${isRtl ? 'right-10' : 'left-10'} text-white`}>
                    <motion.div
                        className="text-3xl font-bold mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        {isRtl ? 'تدفق المطور الذكي' : 'Smart Developer Flow'}
                    </motion.div>
                    <motion.div
                        className="text-xl max-w-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                    >
                        {isRtl
                            ? 'منصة متكاملة تستخدم الذكاء الاصطناعي لتبسيط وتسريع عمليات التطوير وإدارة المشاريع.'
                            : 'An integrated platform using AI to streamline and accelerate development processes and project management.'}
                    </motion.div>
                </div>
            </motion.div>

            {/* Right side form (30%) */}
            <motion.div
                className="w-full lg:w-[30%] flex items-center justify-center px-6 md:px-10"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
            >
                <div className="w-full max-w-md">
                    <motion.div
                        className="flex justify-center"
                        variants={formControls}
                        custom={0}
                        initial="hidden"
                        animate="visible"
                    >
                        <Image
                            src="/assets/DevFlowLogo.png"
                            alt="DevFlow Logo"
                            width={180}
                            height={64}
                            priority
                            className="h-40 w-auto object-contain"
                        />
                    </motion.div>

                    <motion.h2
                        className="text-3xl font-bold text-gray-800 mb-8 text-center"
                        variants={formControls}
                        custom={1}
                        initial="hidden"
                        animate="visible"
                    >
                        {t('loginTitle')}
                    </motion.h2>

                    <AnimatePresence>
                        {(error || formError) && (
                            <motion.div
                                className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2"
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span>
                                    {formError ||
                                        (error === 'User account is inactive' ? t('accountInactive') :
                                            error === 'Invalid email or password' ? t('invalidCredentials') :
                                                t('serverError'))}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <motion.div
                            variants={formControls}
                            custom={2}
                            initial="hidden"
                            animate="visible"
                            className="overflow-hidden"
                        >
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('email')}
                            </label>
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="relative"
                            >
                                <Mail className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-5 w-5 text-gray-400`} />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`appearance-none block w-full ${isRtl ? 'pr-10' : 'pl-10'} px-3 py-3 border ${formState === 'error' ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#45cab0] focus:border-[#45cab0]'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200`}
                                    placeholder={t('email')}
                                    dir="ltr"
                                />
                            </motion.div>
                        </motion.div>

                        <motion.div
                            variants={formControls}
                            custom={3}
                            initial="hidden"
                            animate="visible"
                            className="overflow-hidden"
                        >
                            <div className={`flex items-center justify-between mb-1 flex-row`}>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    {t('password')}
                                </label>

                            </div>
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="relative"
                            >
                                <Lock className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-5 w-5 text-gray-400`} />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`appearance-none block w-full ${isRtl ? 'pr-10' : 'pl-10'} px-3 py-3 border ${formState === 'error' ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#45cab0] focus:border-[#45cab0]'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200`}
                                    placeholder="••••••••"
                                />
                            </motion.div>
                        </motion.div>

                        <motion.div
                            variants={formControls}
                            custom={4}
                            initial="hidden"
                            animate="visible"
                            className="pt-2"
                        >
                            <motion.button
                                type="submit"
                                disabled={buttonLoading || formState === "submitting"}
                                className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#45cab0] transition-all duration-200 ${(buttonLoading || formState === "submitting") ? "opacity-80" : "hover:bg-[#3ab19a]"
                                    }`}
                                style={{
                                    background: `linear-gradient(to right, #45cab0, #2b3a42)`,
                                }}
                                variants={buttonVariants}
                                initial="idle"
                                whileHover={!(buttonLoading || formState === "submitting") ? "hover" : "loading"}
                                whileTap={!(buttonLoading || formState === "submitting") ? "tap" : "loading"}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                                {(buttonLoading || formState === "submitting") ? (
                                    <>
                                        <motion.div
                                            variants={loadingSpinner}
                                            animate="animate"
                                            className="h-5 w-5 text-white"
                                        >
                                            <Loader2 className="h-5 w-5" />
                                        </motion.div>
                                        <span>{t('loggingIn')}</span>
                                    </>
                                ) : (
                                    t('login')
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.form>

                    <motion.div
                        className="mt-8 text-center space-y-2"
                        variants={formControls}
                        custom={5}
                        initial="hidden"
                        animate="visible"
                    >
                        <p className="text-sm text-gray-600">
                            {t('dontHaveAccount')}
                        </p>
                        <p className="text-sm text-gray-600">
                            {t('contactAdmin')}
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Responsive design additions for smaller screens */}
            <style jsx global>{`
                @media (max-width: 640px) {
                    .max-w-md {
                        max-width: 90%;
                    }
                }
            `}</style>
        </div>
    );
}