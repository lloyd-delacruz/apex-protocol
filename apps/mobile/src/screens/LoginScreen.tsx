import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    if (mode === 'register') {
      if (!name.trim()) {
        setError('Name is required');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputProps = (overrides?: TextInputProps): TextInputProps => ({
    style: styles.input,
    placeholderTextColor: colors.textMuted,
    autoCorrect: false,
    ...overrides,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ─────────────────────────────────────────────── */}
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoLetters}>AP</Text>
            </View>
            <Text style={styles.brand}>Apex Protocol</Text>
            <Text style={styles.tagline}>Train with precision.</Text>
          </View>

          {/* ── Card ─────────────────────────────────────────────── */}
          <View style={styles.card}>
            {/* Mode toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
                onPress={() => switchMode('login')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleBtnText, mode === 'login' && styles.toggleBtnTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'register' && styles.toggleBtnActive]}
                onPress={() => switchMode('register')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleBtnText, mode === 'register' && styles.toggleBtnTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name — register only */}
            {mode === 'register' && (
              <View style={styles.field}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  {...inputProps({
                    value: name,
                    onChangeText: setName,
                    placeholder: 'Alex Johnson',
                    autoCapitalize: 'words',
                    returnKeyType: 'next',
                    onSubmitEditing: () => emailRef.current?.focus(),
                  })}
                />
              </View>
            )}

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                ref={emailRef}
                {...inputProps({
                  value: email,
                  onChangeText: setEmail,
                  placeholder: 'you@example.com',
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                  returnKeyType: 'next',
                  onSubmitEditing: () => passwordRef.current?.focus(),
                })}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                {...inputProps({
                  value: password,
                  onChangeText: setPassword,
                  placeholder: mode === 'register' ? 'Min. 8 characters' : '••••••••',
                  secureTextEntry: true,
                  returnKeyType: 'done',
                  onSubmitEditing: handleSubmit,
                })}
              />
            </View>

            {/* Error */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Dev bypass */}
            {__DEV__ && (
              <TouchableOpacity
                style={styles.bypassBtn}
                onPress={useAuth().loginDev}
                activeOpacity={0.7}
              >
                <Text style={styles.bypassBtnText}>Skip to Dashboard (Dev Mode)</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoLetters: { color: colors.background, fontSize: 24, fontWeight: '800' },
  brand: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 3,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: { backgroundColor: colors.surfaceElevated },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  toggleBtnTextActive: { color: colors.textPrimary },
  field: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: colors.background, fontSize: 15, fontWeight: '700' },
  bypassBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bypassBtnText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
