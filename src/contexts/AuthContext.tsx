import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient } from '../lib/api'

// Simple User and Session types to replicate what we need
export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin?: boolean;
  is_verified?: boolean;
  created_at?: string;
}

export interface Session {
  access_token: string;
  token_type: string;
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, userData?: { full_name?: string }) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  requestPasswordReset: (email: string) => Promise<any>
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<any>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          apiClient.setToken(token);
          const userProfile = await apiClient.getCurrentUser();
          setUser(userProfile);
        } catch (error) {
          console.error('Failed to restore session:', error);
          apiClient.clearToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, userData?: { full_name?: string }) => {
    try {
      const result = await apiClient.register(email, password, userData?.full_name);
      // Backend automatically logs in or returns user info? 
      // Usually after signup we might want to manually login or handled by backend response.
      // Based on previous implementation, let's just trigger a sign in.
      if (result) {
        return await signIn(email, password);
      }
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (response.access_token) {
        const userProfile = await apiClient.getCurrentUser();
        setUser(userProfile);
        return { data: { user: userProfile }, error: null };
      }
      return { data: null, error: { message: 'Login failed' } };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { url } = await apiClient.getGoogleAuthUrl();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to get Google Auth URL:', error);
    }
  };

  const signOut = async () => {
    try {
      await apiClient.logoutSession();
    } catch (e) {
      console.warn('Backend logout failed', e);
    }
    apiClient.clearToken();
    setUser(null);
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const result = await apiClient.requestPasswordReset(email);
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const confirmPasswordReset = async (email: string, code: string, newPassword: string) => {
    try {
      const result = await apiClient.confirmPasswordReset(email, code, newPassword);
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    requestPasswordReset,
    confirmPasswordReset,
    signInWithGoogle,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
