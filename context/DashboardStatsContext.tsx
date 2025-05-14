"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DashboardStatsContextType {
    // Track last refresh timestamps for different data types
    lastRefreshed: {
        users: Date | null;
        projects: Date | null;
        frameworks: Date | null;
    };
    // Method to notify the dashboard that data has been refreshed
    notifyRefresh: (dataType: 'users' | 'projects' | 'frameworks') => void;
    // Subscribers can use this to trigger refreshes in other components
    refreshAll: () => void;
    // Subscribe to refresh events
    subscribeToRefresh: (listener: () => void) => () => void;
}

// Default context values
const defaultContext: DashboardStatsContextType = {
    lastRefreshed: {
        users: null,
        projects: null,
        frameworks: null
    },
    notifyRefresh: () => { },
    refreshAll: () => { },
    subscribeToRefresh: () => () => { }
};

// Create the context
const DashboardStatsContext = createContext<DashboardStatsContextType>(defaultContext);

// Custom hook to use the context
export const useDashboardStats = () => useContext(DashboardStatsContext);

interface DashboardStatsProviderProps {
    children: ReactNode;
}

export function DashboardStatsProvider({ children }: DashboardStatsProviderProps) {
    // State to track when each data type was last refreshed
    const [lastRefreshed, setLastRefreshed] = useState<DashboardStatsContextType['lastRefreshed']>({
        users: null,
        projects: null,
        frameworks: null
    });

    // Event listeners for refresh events
    const [refreshListeners] = useState(new Set<() => void>());

    // Method to update the last refreshed timestamp for a data type
    const notifyRefresh = useCallback((dataType: 'users' | 'projects' | 'frameworks') => {
        setLastRefreshed(prev => ({
            ...prev,
            [dataType]: new Date()
        }));
    }, []);

    // Method to trigger all refresh listeners
    const refreshAll = useCallback(() => {
        refreshListeners.forEach(listener => listener());
    }, [refreshListeners]);

    // Subscribe to refresh events
    const subscribeToRefresh = useCallback((listener: () => void) => {
        refreshListeners.add(listener);
        return () => {
            refreshListeners.delete(listener);
        };
    }, [refreshListeners]);

    // The context value
    const value = {
        lastRefreshed,
        notifyRefresh,
        refreshAll,
        subscribeToRefresh
    };

    return (
        <DashboardStatsContext.Provider value={value}>
            {children}
        </DashboardStatsContext.Provider>
    );
} 