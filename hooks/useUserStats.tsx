import { useState, useEffect } from 'react';
import { getAllUsers } from '@/lib/services/userService';
import { User } from '@/lib/services/userService';

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: Record<string, number>;
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date;
}

export function useUserStats() {
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        usersByRole: {},
        isLoading: true,
        error: null,
        lastUpdated: new Date()
    });

    const fetchUserStats = async () => {
        try {
            setStats(prev => ({ ...prev, isLoading: true, error: null }));

            // Fetch all users from the API
            const users = await getAllUsers();

            // Count active and inactive users
            const activeUsers = users.filter(user => user.status === 'Active').length;
            const inactiveUsers = users.filter(user => user.status === 'Inactive').length;

            // Count users by role
            const usersByRole: Record<string, number> = {};
            users.forEach(user => {
                const role = user.role;
                usersByRole[role] = (usersByRole[role] || 0) + 1;
            });

            // Update the stats
            setStats({
                totalUsers: users.length,
                activeUsers,
                inactiveUsers,
                usersByRole,
                isLoading: false,
                error: null,
                lastUpdated: new Date()
            });
        } catch (error) {
            console.error("Error fetching user stats:", error);
            setStats(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'An error occurred fetching user data'
            }));
        }
    };

    // Fetch user stats on mount
    useEffect(() => {
        fetchUserStats();
    }, []);

    return {
        ...stats,
        refreshStats: fetchUserStats
    };
} 