/**
 * Validation Utilities
 *
 * Pure functions for form field validation.
 * Returns null on pass, error string on fail.
 */

import { CONFIG } from '../constants/config';

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < CONFIG.MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  return null;
}

export function validateWeight(value: string): string | null {
  const num = parseFloat(value);
  if (isNaN(num)) return 'Enter a valid weight';
  if (num <= 0) return 'Weight must be greater than 0';
  if (num > 500) return 'Weight seems too high';
  return null;
}

export function validateReps(value: string): string | null {
  const num = parseInt(value, 10);
  if (isNaN(num)) return 'Enter a valid rep count';
  if (num <= 0) return 'Reps must be greater than 0';
  if (num > 100) return 'Rep count seems too high';
  return null;
}
