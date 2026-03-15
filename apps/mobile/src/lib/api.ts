/**
 * Apex Protocol Mobile — API Client
 *
 * Wraps the shared createApiClient with React Native storage.
 * Uses AsyncStorage for token persistence across app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiClient } from '@apex/shared';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'apex_token';
const REFRESH_TOKEN_KEY = 'apex_refresh_token';

// ─── Token helpers ────────────────────────────────────────────────────────────

let _cachedToken: string | null = null;
let _cachedRefreshToken: string | null = null;

export async function saveToken(token: string) {
  _cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function loadToken() {
  if (_cachedToken) return _cachedToken;
  _cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return _cachedToken;
}

export async function clearToken() {
  _cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function saveRefreshToken(token: string) {
  _cachedRefreshToken = token;
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export async function loadRefreshToken() {
  if (_cachedRefreshToken) return _cachedRefreshToken;
  _cachedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  return _cachedRefreshToken;
}

export async function clearRefreshToken() {
  _cachedRefreshToken = null;
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ─── API client singleton ─────────────────────────────────────────────────────

export const api = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => _cachedToken,
  onUnauthorized: async () => {
    await clearToken();
    await clearRefreshToken();
    console.warn('[API] Unauthorized — tokens cleared, user will be redirected to login');
  },
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await api.auth.login(email, password);

  if (res.success && res.data) {
    const data = res.data as { token: string; refreshToken: string; user: unknown };
    await saveToken(data.token);
    if (data.refreshToken) await saveRefreshToken(data.refreshToken);
    return { token: data.token, refreshToken: data.refreshToken, user: data.user };
  }

  throw new Error(res.error ?? 'Login failed');
}

export async function register(email: string, password: string, name: string) {
  const res = await api.auth.register(email, password, name);

  if (res.success && res.data) {
    const data = res.data as { token: string; refreshToken: string; user: unknown };
    await saveToken(data.token);
    if (data.refreshToken) await saveRefreshToken(data.refreshToken);
    return { token: data.token, refreshToken: data.refreshToken, user: data.user };
  }

  throw new Error(res.error ?? 'Registration failed');
}

export async function logout() {
  const refreshToken = await loadRefreshToken();
  await api.auth.logout(refreshToken ?? undefined);
  await clearToken();
  await clearRefreshToken();
}

export default api;
