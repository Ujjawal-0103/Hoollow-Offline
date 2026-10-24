'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types';
import { api, MOCK_USER } from '@/lib/api-client';

interface AuthContextType extends AuthState {
  isOnline: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loginWithDemoAccount: () => void;
  updateUserStats: (xpDelta: number, streakIncrement?: boolean) => void;
  checkServerConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'upwise_user';
const STORAGE_KEY_TOKEN = 'upwise_token';

function getInitialUser(): User {
  if (typeof window === 'undefined') {
    return MOCK_USER;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // fallback
  }
  return MOCK_USER;
}

function getInitialToken(): string {
  if (typeof window === 'undefined') {
    return 'mock-demo-token-123';
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (stored) {
      return stored;
    }
  } catch {
    // fallback
  }
  return 'mock-demo-token-123';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const checkServerConnection = async (): Promise<boolean> => {
    const health = await api.checkHealth();
    setIsOnline(health.online);
    return health.online;
  };

  useEffect(() => {
    let isMounted = true;
    const poll = () => {
      api.checkHealth().then((health) => {
        if (isMounted) {
          setIsOnline(health.online);
        }
      });
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const ensureLearnerProfile = async (targetUser: User) => {
    try {
      const profileRes = await api.getLearnerProfile(targetUser.id);
      if (!profileRes.success) {
        await api.createLearnerProfile({
          id: targetUser.id,
          displayName: targetUser.name,
          currentLevel: (targetUser.level?.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') || 'BEGINNER',
          learningGoal: targetUser.learningGoal || 'Full-Stack Web Development',
          minutesPerDay: 30,
        });
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    if (user && isOnline) {
      ensureLearnerProfile(user);
    }
  }, [user, isOnline]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res.data.user));
          localStorage.setItem(STORAGE_KEY_TOKEN, res.data.token);
        }
        ensureLearnerProfile(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.error?.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.register(name, email, password);
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res.data.user));
          localStorage.setItem(STORAGE_KEY_TOKEN, res.data.token);
        }
        ensureLearnerProfile(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.error?.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout().catch(() => {});
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  };

  const loginWithDemoAccount = () => {
    setUser(MOCK_USER);
    setToken('mock-demo-token-123');
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(MOCK_USER));
      localStorage.setItem(STORAGE_KEY_TOKEN, 'mock-demo-token-123');
    }
    ensureLearnerProfile(MOCK_USER);
  };

  const updateUserStats = (xpDelta: number, streakIncrement = false) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated: User = {
        ...prev,
        xp: Math.max(0, prev.xp + xpDelta),
        streak: streakIncrement ? prev.streak + 1 : prev.streak,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isOnline,
        login,
        register,
        logout,
        loginWithDemoAccount,
        updateUserStats,
        checkServerConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
