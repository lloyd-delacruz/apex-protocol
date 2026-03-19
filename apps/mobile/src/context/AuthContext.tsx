import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, loadToken } from '../lib/api';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  onboardingComplete?: boolean;
  subscriptionActive?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  onboardingComplete: boolean;
  subscriptionActive: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setOnboardingComplete: (complete: boolean) => void;
  setSubscriptionActive: (active: boolean) => void;
  loginDev: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [subscriptionActive, setSubscriptionActiveState] = useState(false);

  // Restore session on app start
  useEffect(() => {
    async function restore() {
      try {
        const token = await loadToken();
        if (token) {
          const res = await api.auth.me();
          if (res.success && res.data) {
            const u = res.data.user as AuthUser;
            setUser(u);
            setOnboardingCompleteState(!!u.onboardingComplete);
            setSubscriptionActiveState(!!u.subscriptionActive);
          }
        }
      } catch {
        // Invalid or expired token — remain logged out
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    const u = result.user as AuthUser;
    setUser(u);
    setOnboardingCompleteState(!!u.onboardingComplete);
    setSubscriptionActiveState(!!u.subscriptionActive);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const result = await apiRegister(email, password, name);
    const u = result.user as AuthUser;
    setUser(u);
    setOnboardingCompleteState(false);
    setSubscriptionActiveState(false);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setOnboardingCompleteState(false);
    setSubscriptionActiveState(false);
  }, []);

  const setOnboardingComplete = useCallback((complete: boolean) => {
    setOnboardingCompleteState(complete);
  }, []);

  const setSubscriptionActive = useCallback((active: boolean) => {
    setSubscriptionActiveState(active);
  }, []);

  const loginDev = useCallback(() => {
    setUser({
      id: 'dev-user-001',
      email: 'dev@apexprotocol.io',
      name: 'Development User',
      firstName: 'Dev',
      lastName: 'User',
      onboardingComplete: false,
      subscriptionActive: false,
    });
    setOnboardingCompleteState(false);
    setSubscriptionActiveState(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        onboardingComplete,
        subscriptionActive,
        login,
        register,
        logout,
        setOnboardingComplete,
        setSubscriptionActive,
        loginDev,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
