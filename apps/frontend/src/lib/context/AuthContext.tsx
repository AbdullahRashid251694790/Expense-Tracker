/**
 * Auth Context
 * Global authentication state management with API-based auth
 * Uses cross-platform storage for Android compatibility
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, ApiError } from '@/lib/api/client';
import { Storage } from '@/lib/storage/storage';
import type { User, LoginRequest, CreateUserRequest, AuthState } from '@casha/shared';

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: CreateUserRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL = getApiUrl();

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = await Storage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await Storage.setItem('accessToken', data.accessToken);
        await Storage.setItem('refreshToken', data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }, []);

  // Fetch current user profile
  const fetchUser = useCallback(async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
    return null;
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      // Initialize storage (loads native storage to localStorage on Android)
      await Storage.initializeStorage();

      const token = await Storage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Try to fetch user with current token
      let userData = await fetchUser(token);

      // If token expired, try to refresh
      if (!userData) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const newToken = await Storage.getItem('accessToken');
          if (newToken) {
            userData = await fetchUser(newToken);
          }
        }
      }

      if (userData) {
        setUser(userData);
      } else {
        // Clear invalid tokens
        await Storage.removeItem('accessToken');
        await Storage.removeItem('refreshToken');
      }

      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser, refreshAccessToken]);

  // Auto-refresh token periodically (every 6 minutes for 7-day tokens)
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(async () => {
      await refreshAccessToken();
    }, 6 * 60 * 1000); // Every 6 minutes

    return () => clearInterval(intervalId);
  }, [user, refreshAccessToken]);

  // Listen for auth:logout events (e.g., from API 401 responses)
  useEffect(() => {
    const handleLogout = async () => {
      setUser(null);
      await Storage.removeItem('accessToken');
      await Storage.removeItem('refreshToken');
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || 'Login failed', response.status);
    }

    const result = await response.json();
    await Storage.setItem('accessToken', result.tokens.accessToken);
    await Storage.setItem('refreshToken', result.tokens.refreshToken);
    setUser(result.user);
  }, []);

  const register = useCallback(async (data: CreateUserRequest) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || 'Registration failed', response.status);
    }

    const result = await response.json();
    await Storage.setItem('accessToken', result.tokens.accessToken);
    await Storage.setItem('refreshToken', result.tokens.refreshToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await Storage.getItem('refreshToken');
    const accessToken = await Storage.getItem('accessToken');

    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await Storage.removeItem('accessToken');
      await Storage.removeItem('refreshToken');
      setUser(null);
      // Use React Router instead of window.location for proper SPA navigation
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const token = await Storage.getItem('accessToken');
    if (!token) return;

    const userData = await fetchUser(token);
    if (userData) {
      setUser(userData);
    }
  }, [fetchUser]);

  const getAccessToken = useCallback(() => {
    // Use sync version for immediate access (needed for API calls)
    return Storage.getItemSync('accessToken');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
