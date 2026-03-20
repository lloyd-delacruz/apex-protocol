/**
 * Apex Protocol Mobile — API Client
 *
 * Wraps the shared createApiClient with React Native storage.
 * Uses AsyncStorage for token persistence across app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createApiClient } from '@apex/shared';

// ─── Config ───────────────────────────────────────────────────────────────────

// Resolve the dev machine's IP from Expo so physical devices can connect.
// expoConfig.hostUri is like "192.168.1.5:8081" — we strip the Expo port
// and replace it with the backend's port (4001).
function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri ??          // SDK 49+
    (Constants as any).manifest?.debuggerHost; // older SDKs

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0]; // strip Expo port
    return `http://${host}:4001`;
  }

  // Fallback for simulators / web
  return 'http://localhost:4001';
}

const API_BASE_URL = getApiBaseUrl();
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
    const data = res.data;
    await saveToken(data.token);
    if (data.refreshToken) await saveRefreshToken(data.refreshToken);
    return { token: data.token, refreshToken: data.refreshToken, user: data.user };
  }

  throw new Error(res.error ?? 'Login failed');
}

export async function register(email: string, password: string, name: string) {
  const res = await api.auth.register(email, password, name);

  if (res.success && res.data) {
    const data = res.data;
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
