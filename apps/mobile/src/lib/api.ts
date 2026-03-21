/**
 * Apex Protocol Mobile — API Client
 *
 * Wraps the shared createApiClient with React Native storage.
 * Uses AsyncStorage for token persistence across app restarts.
 *
 * Notes:
 * - Prefers EXPO_PUBLIC_API_URL when explicitly set
 * - Supports Expo Go host detection for real devices
 * - Falls back to localhost only for simulators/emulators
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createApiClient } from '@apex/shared';

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * Resolve the backend base URL.
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_URL from apps/mobile/.env
 * 2. Expo Go detected host (real device on LAN)
 * 3. localhost fallback (simulator/emulator only)
 */
function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // 1. Check if we are running in a simulator/emulator
  // In Expo, Constants.isDevice is often available via expo-device.
  // But we can also check for 'localhost' needs by sniffing the environment.
  const isSimulator = (Constants as any)?.appOwnership !== 'expo' && 
                     !(Constants as any)?.isDevice;

  if (isSimulator && !envUrl?.includes('10.0.2.2')) {
    // Android emulators need 10.0.2.2, iOS usually localhost.
    // If we are on a simulator and the env says LAN IP, it might be safer to try localhost.
    console.log('[API FORENSIC] Simulator detected, preferring localhost');
    return 'http://localhost:4001';
  }

  if (envUrl) {
    console.log('[API FORENSIC] Using EXPO_PUBLIC_API_URL:', envUrl);
    return envUrl;
  }

  // 2. Try to detect LAN IP from Expo Constants (Debugger Host)
  const expoGoDebuggerHost = (Constants as any)?.expoGoConfig?.debuggerHost;
  const expoConfigHostUri = (Constants as any)?.expoConfig?.hostUri;
  const manifest2HostUri = (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
  const legacyManifestDebuggerHost = (Constants as any)?.manifest?.debuggerHost;

  const debuggerHost =
    expoGoDebuggerHost ?? expoConfigHostUri ?? manifest2HostUri ?? legacyManifestDebuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    const resolvedUrl = `http://${host}:4001`;
    console.log('[API FORENSIC] Success — Resolved host IP from Expo:', host);
    return resolvedUrl;
  }

  const fallbackUrl = 'http://localhost:4001';
  console.log('[API FORENSIC] Fallback to localhost');
  return fallbackUrl;
}

export const API_BASE_URL = getApiBaseUrl();
console.log('[API FORENSIC] FINAL API_BASE_URL:', API_BASE_URL);

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

// ─── Unauthorized listener ────────────────────────────────────────────────────

// AuthContext registers this so it can clear React state + show an alert
// when any API call returns 401/403 (expired or invalid token).
let _unauthorizedCallback: (() => void) | null = null;

export function setUnauthorizedHandler(cb: () => void) {
  _unauthorizedCallback = cb;
}

// ─── API client singleton ─────────────────────────────────────────────────────

export const api = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: loadToken,
  onUnauthorized: async () => {
    await clearToken();
    await clearRefreshToken();
    _unauthorizedCallback?.();
  },
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  console.log('[Auth] login() — attempting:', email);

  const res = await api.auth.login(email, password);

  if (res.success && res.data) {
    const data = res.data;
    await saveToken(data.token);

    if (data.refreshToken) {
      await saveRefreshToken(data.refreshToken);
    }

    console.log(
      '[Auth] login() — success, token saved. user:',
      data.user?.id,
      'onboardingComplete:',
      data.user?.onboardingComplete
    );

    return {
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  }

  console.warn('[Auth] login() — failed:', res.error);
  throw new Error(res.error ?? 'Login failed');
}

export async function register(email: string, password: string, name: string) {
  console.log('[Auth] register() — attempting:', email);

  const res = await api.auth.register(email, password, name);

  if (res.success && res.data) {
    const data = res.data;
    await saveToken(data.token);

    if (data.refreshToken) {
      await saveRefreshToken(data.refreshToken);
    }

    console.log(
      '[Auth] register() — success, token saved. user:',
      data.user?.id,
      'onboardingComplete:',
      data.user?.onboardingComplete
    );

    return {
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  }

  console.warn('[Auth] register() — failed:', res.error);
  throw new Error(res.error ?? 'Registration failed');
}

export async function logout() {
  console.log('[Auth] logout() — starting');

  const refreshToken = await loadRefreshToken();

  try {
    await api.auth.logout(refreshToken ?? undefined);
  } catch (error) {
    console.warn('[Auth] logout() — API logout failed, clearing local tokens anyway:', error);
  }

  await clearToken();
  await clearRefreshToken();

  console.log('[Auth] logout() — local tokens cleared');
}

export default api;