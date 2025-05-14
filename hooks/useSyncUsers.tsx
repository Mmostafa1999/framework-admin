import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getAllUsers, getUserById, updateUser, deleteUser } from '@/lib/services/userService';
import { User } from '@/lib/services/userService';
import React from 'react';

// Define the context shape
interface UsersContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  updateUserData: (userId: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
}

// Create the context with default values
const UsersContext = createContext<UsersContextType>({
  users: [],
  loading: false,
  error: null,
  refreshUsers: async () => { },
  updateUserData: async () => false,
  removeUser: async () => false,
});

// Provider component
export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
      setLastRefresh(Date.now());
      return fetchedUsers;
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch users');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a user
  const updateUserData = useCallback(async (
    userId: string,
    userData: Partial<Omit<User, 'id' | 'createdAt'>>
  ) => {
    try {
      setLoading(true);
      await updateUser(userId, userData);

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, ...userData } : user
        )
      );

      // Fetch updated user to ensure we have the latest data
      const updatedUser = await getUserById(userId);
      if (updatedUser) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? updatedUser : user
          )
        );
      }

      setLastRefresh(Date.now());
      return true;
    } catch (err) {
      setError((err as Error).message || 'Failed to update user');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a user
  const removeUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      await deleteUser(userId);

      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));

      setLastRefresh(Date.now());
      return true;
    } catch (err) {
      setError((err as Error).message || 'Failed to delete user');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh users data
  const refreshUsers = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Set up periodic refresh every 5 minutes
  useEffect(() => {
    const syncInterval = setInterval(() => {
      // Only refresh if it's been more than 5 minutes since the last refresh
      if (Date.now() - lastRefresh > 5 * 60 * 1000) {
        fetchUsers();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(syncInterval);
  }, [fetchUsers, lastRefresh]);

  return (
    <UsersContext.Provider value={{
      users,
      loading,
      error,
      refreshUsers,
      updateUserData,
      removeUser
    }}>
      {children}
    </UsersContext.Provider>
  );
}

// Hook to consume the context
export function useSyncUsers() {
  const context = useContext(UsersContext);

  if (context === undefined) {
    throw new Error('useSyncUsers must be used within a UsersProvider');
  }

  return context;
}

// Export a function to wrap a component with the provider
export function withUsersProvider<T extends React.JSX.IntrinsicAttributes>(Component: React.ComponentType<T>) {
  return function WithUsersProvider(props: T) {
    return (
      <UsersProvider>
        <Component {...props} />
      </UsersProvider>
    );
  };
} 