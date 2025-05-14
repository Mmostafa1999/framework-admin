import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getIdToken,
  onAuthStateChanged
} from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { User } from '@/types/firebase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (userId: string, data: Partial<User>) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const locale = useLocale();
  const router = useRouter();

  // Fetch session data from the API
  const fetchSessionData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      const data = await response.json();

      if (data.authenticated) {
        // Get full user data from the users API
        const userResponse = await fetch(`/api/users/${data.uid}`, {
          method: 'GET',
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setState({
            user: userData.user,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            error: 'Failed to get user data',
          });
        }
      } else {
        setState({
          user: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setState({
        user: null,
        isLoading: false,
        error: (error as Error).message,
      });
    }
  }, []);

  // Listen for auth state changes and create session cookie
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the ID token
          const idToken = await getIdToken(firebaseUser);

          // Create a session cookie via our API
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });

          if (!response.ok) {
            throw new Error('Failed to establish session');
          }

          // Fetch session data to get the user
          await fetchSessionData();
        } catch (error) {
          console.error('Error creating session:', error);
          setState({
            user: null,
            isLoading: false,
            error: (error as Error).message,
          });
        }
      } else {
        // No user is signed in, ensure session is cleared
        setState({
          user: null,
          isLoading: false,
          error: null,
        });
      }
    });

    // Fetch session data on initial load
    fetchSessionData();

    return () => unsubscribe();
  }, [fetchSessionData]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Starting login process');

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase authentication successful');

      // Get the ID token
      const idToken = await getIdToken(userCredential.user);

      // Create a session cookie via our API
      console.log('Creating session cookie');
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to establish session' }));
        throw new Error(errorData.error || 'Failed to establish session');
      }

      console.log('Session cookie created successfully');

      // Get session data in a single call
      console.log('Fetching session data');
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({ error: 'Failed to get user session' }));
        throw new Error(errorData.error || 'Failed to get user session');
      }

      const sessionData = await sessionResponse.json();
      console.log('Session data retrieved', { authenticated: sessionData.authenticated });

      if (!sessionData.authenticated) {
        throw new Error('Authentication failed - No valid session');
      }

      // Get user data to update the state
      console.log(`Fetching user data for UID: ${sessionData.uid}`);
      const userResponse = await fetch(`/api/users/${sessionData.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        // Handle specific error codes
        if (userResponse.status === 404) {
          throw new Error('User not found in database. Please contact an administrator.');
        } else {
          const errorData = await userResponse.json().catch(() => ({ error: 'Failed to get user data' }));
          throw new Error(errorData.error || 'Failed to get user data');
        }
      }

      const userData = await userResponse.json();
      console.log('User data retrieved successfully');

      // Update state with the user data
      setState({
        user: userData.user,
        isLoading: false,
        error: null,
      });

      // Redirect based on user role
      const userRole = userData.user?.role || sessionData.role || '';
      console.log(`Redirecting user with role: ${userRole}`);

      if (userRole === 'Admin') {
        router.push(`/${locale}/home`);
      } else if (userRole === 'Consultant') {
        router.push(`/${locale}/consultant`);
      } else if (userRole === 'Client') {
        router.push(`/${locale}/client`);
      } else {
        // Default for users with no specific role or unknown role
        console.log('User has no defined role, redirecting to default page');
        router.push(`/${locale}/home`);
      }
    } catch (error) {
      console.error('Login error:', error);
      setState({
        user: null,
        isLoading: false,
        error: (error as Error).message || 'Authentication failed',
      });

      // Make sure to throw the error so the UI can handle it
      throw error;
    }
  }, [locale, router]);

  // Logout function
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Sign out from Firebase Auth
      await firebaseSignOut(auth);

      // Delete the session cookie
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });

      setState({
        user: null,
        isLoading: false,
        error: null,
      });

      // Redirect to login page
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error('Logout error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message
      }));
    }
  }, [locale, router]);

  // Update user data
  const updateUserData = useCallback(async (userId: string, data: Partial<User>) => {
    try {
      // Call the API to update the user
      const response = await fetch('/api/admin/update-user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      // Update local state if the current user is being updated
      if (state.user && state.user.id === userId) {
        setState((prev) => ({
          ...prev,
          user: prev.user ? { ...prev.user, ...data } : null,
        }));
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }, [state.user]);

  return {
    ...state,
    login,
    logout,
    updateUserData,
  };
} 