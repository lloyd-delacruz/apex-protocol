import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { login as apiLogin, register as apiRegister, logout as apiLogout, loadToken, setUnauthorizedHandler } from '../lib/api';
import api from '../lib/api';
import type { AuthUser } from '../types/api';

export type { AuthUser };

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
  resetDevelopment: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [subscriptionActive, setSubscriptionActiveState] = useState(false);

  // Register global unauthorized handler — fires when any API call returns 401/403
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      if (require('../constants/config').CONFIG.DEV_MODE) {
        console.warn('[AuthContext] Session expired (DEV_MODE) — bypassing force-logout');
        return;
      }

      console.warn('[AuthContext] Session expired — clearing state and redirecting');
      
      // Reset all auth state
      setUser(null);
      setOnboardingCompleteState(false);
      setSubscriptionActiveState(false);
      
      // Delay alert so navigation has time to redirect to login first
      setTimeout(() => {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please sign in again.',
          [{ text: 'OK' }]
        );
      }, 300);
    });
  }, []);

  // Restore session on app start
  useEffect(() => {
    async function restore() {
      try {
        const token = await loadToken();
        console.log('[AuthContext] restore() — token found:', !!token);
        if (token) {
          const res = await api.auth.me();
          if (res.success && res.data) {
            const u = res.data.user as AuthUser;
            setUser(u);
            setOnboardingCompleteState(!!u.onboardingComplete);
            setSubscriptionActiveState(!!u.subscriptionActive);
            console.log('[AuthContext] restore() — session restored. user:', u.id, 'onboardingComplete:', u.onboardingComplete);
          } else if (!res.success) {
            // Token exists but is invalid/expired — clear it and remain logged out
            console.warn('[AuthContext] restore() — token invalid, clearing storage:', res.error);
            const { clearToken, clearRefreshToken } = await import('../lib/api');
            await clearToken();
            await clearRefreshToken();
            setUser(null);
          }
        }
      } catch (e) {
        // Network error during restore — remain logged out, no alert needed
        console.warn('[AuthContext] restore() — network error:', e);
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
    console.log('[AuthContext] login() — auth state updated. user:', u.id, 'onboardingComplete:', u.onboardingComplete, '→ navigating to', u.onboardingComplete ? 'Main' : 'Onboarding');
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

  const loginDev = useCallback(async () => {
    const mockUser: AuthUser = {
      id: '00000000-0000-0000-0000-000000000000', // Matches backend stable mock ID
      email: 'dev@apexprotocol.io',
      name: 'Development User',
      firstName: 'Dev',
      lastName: 'User',
      onboardingComplete: false,
      subscriptionActive: true,
    };
    
    // Save the dummy-token that the backend recognizes in dev mode
    import('../lib/api').then(m => m.saveToken('dummy-token'));
    
    setUser(mockUser);
    setOnboardingCompleteState(false);
    setSubscriptionActiveState(true);
    console.log('[AuthContext] loginDev() — Bypass active with stable mock token.');
  }, []);

  const resetDevelopment = useCallback(async () => {
    try {
      // 1. Clear ALL AsyncStorage
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.clear();

      // 2. Clear tokens via API lib (extra safety)
      const { clearToken, clearRefreshToken } = await import('../lib/api');
      await clearToken();
      await clearRefreshToken();

      // 3. Reset internal state
      setUser(null);
      setOnboardingCompleteState(false);
      setSubscriptionActiveState(false);

      console.log('[AuthContext] resetDevelopment() — storage cleared, session nuked. Redirecting to Auth.');
    } catch (e) {
      console.error('[AuthContext] resetDevelopment failed:', e);
      Alert.alert('Reset Failed', 'Could not clear application data.');
    }
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
        resetDevelopment,
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
