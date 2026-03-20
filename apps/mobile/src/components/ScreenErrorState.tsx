import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  message?: string | null;
  onRetry?: () => void;
}

/**
 * Full-screen error state with an optional retry button.
 * Wrap inside whatever background/safe-area the screen uses.
 */
export default function ScreenErrorState({ message, onRetry }: Props) {
  const isNetwork =
    message?.toLowerCase().includes('connect') ||
    message?.toLowerCase().includes('network') ||
    message?.toLowerCase().includes('timeout') ||
    message?.toLowerCase().includes('reach');

  return (
    <View style={styles.container}>
      <Ionicons
        name={isNetwork ? 'cloud-offline-outline' : 'alert-circle-outline'}
        size={48}
        color={colors.textMuted}
      />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        {message ?? 'An unexpected error occurred.'}
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.retryText}>RETRY</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
