'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/firebase';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUserData: (userId: string, data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();

    const authWithLoading = {
        ...auth,
        loading: auth.isLoading, // Provide legacy support for apps using 'loading' property
    };

    return (
        <AuthContext.Provider value={authWithLoading}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }

    return context;
} 