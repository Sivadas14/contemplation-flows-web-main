import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/apis';

// Types based on backend wire.py
export interface User {
    id: string;
    email: string;
    name: string | null;
    email_verified: boolean;
    role: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}

export interface SuccessResponse {
    success: boolean;
    message: string;
    data?: any;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<AuthResponse>;
    register: (email: string, password: string, name: string) => Promise<SuccessResponse>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<boolean>;
    refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user && !!localStorage.getItem('accessToken');

    // Check if user is authenticated on app load
    useEffect(() => {
        checkAuth();
    }, []);

    // Set up automatic token refresh every 50 minutes (tokens expire in 1 hour)
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            if (isAuthenticated) {
                refreshToken();
            }
        }, 50 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, [isAuthenticated]);

    const login = async (email: string, password: string): Promise<AuthResponse> => {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/login', {
                email: email.trim().toLowerCase(),
                password,
            });

            const authResponse = response.data;
            localStorage.setItem('accessToken', authResponse.access_token);
            localStorage.setItem('refreshToken', authResponse.refresh_token);
            setUser(authResponse.user);

            return authResponse;
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.response?.data?.detail || 'Invalid email or password');
        }
    };

    const register = async (email: string, password: string, name: string): Promise<SuccessResponse> => {
        try {
            const response = await apiClient.post<SuccessResponse>('/auth/register', {
                email: email.trim().toLowerCase(),
                password,
                name: name.trim(),
            });

            return response.data;
        } catch (error: any) {
            console.error('Registration error:', error);
            throw new Error(error.response?.data?.detail || 'Registration failed. Please try again.');
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
        }
    };

    const checkAuth = async (): Promise<boolean> => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            setIsLoading(false);
            return false;
        }

        try {
            const response = await apiClient.get<User>('/auth/me');
            setUser(response.data);
            setIsLoading(false);
            return true;
        } catch (error: any) {
            console.error('Auth check failed:', error);

            if (error.response?.status === 401) {
                const refreshSuccess = await refreshToken();
                if (refreshSuccess) {
                    return await checkAuth();
                }
            }

            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsLoading(false);
            return false;
        }
    };

    const refreshToken = async (): Promise<boolean> => {
        const refreshTokenValue = localStorage.getItem('refreshToken');

        if (!refreshTokenValue) {
            return false;
        }

        try {
            const response = await apiClient.post<AuthResponse>('/auth/refresh', {
                refresh_token: refreshTokenValue,
            });

            localStorage.setItem('accessToken', response.data.access_token);
            localStorage.setItem('refreshToken', response.data.refresh_token);
            setUser(response.data.user);
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            return false;
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
        refreshToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
