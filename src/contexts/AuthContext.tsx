import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const response = await authAPI.getCurrentUser();
                    setUser(response.user);
                } catch (error) {
                    // Token is invalid, clear it
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await authAPI.login({ email, password });
        setUser(response.user);
    };

    const register = async (name: string, email: string, password: string) => {
        const response = await authAPI.register({ name, email, password });
        setUser(response.user);
    };

    const logout = () => {
        authAPI.logout();
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const response = await authAPI.getCurrentUser();
            setUser(response.user);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
