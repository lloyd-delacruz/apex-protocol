import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';
import { signToken } from '../middleware/auth';

// ─── Public shape returned to API consumers ───────────────────────────────────

function safeUser(user: { id: string; email: string; firstName: string | null; lastName: string | null; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt.toISOString(),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const AuthService = {
  /**
   * Register a new user account.
   * Returns an access token, a refresh token, and a safe user object.
   */
  async register(email: string, password: string, name: string) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw Object.assign(new Error('An account with this email already exists'), { statusCode: 409 });
    }

    const roleId = await UserRepository.findDefaultRoleId();
    if (!roleId) {
      throw Object.assign(new Error('Default role not configured — run db:seed first'), { statusCode: 500 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const parts = name.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;

    const user = await UserRepository.create({ email, passwordHash, firstName, lastName, roleId });
    const token = signToken(user.id);
    const { rawToken: refreshToken } = await RefreshTokenRepository.create(user.id);

    return { token, refreshToken, user: safeUser(user) };
  },

  /**
   * Log in an existing user.
   * Returns an access token, a refresh token, and a safe user object.
   */
  async login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const token = signToken(user.id);
    const { rawToken: refreshToken } = await RefreshTokenRepository.create(user.id);

    return { token, refreshToken, user: safeUser(user) };
  },

  /**
   * Exchange a valid refresh token for a new access + refresh token pair.
   * The old refresh token is revoked (rotation).
   */
  async refresh(rawRefreshToken: string) {
    const record = await RefreshTokenRepository.findValid(rawRefreshToken);
    if (!record) {
      throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
    }

    // Revoke old token immediately (rotation prevents reuse)
    await RefreshTokenRepository.revoke(record.id);

    const user = await UserRepository.findById(record.userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const token = signToken(user.id);
    const { rawToken: refreshToken } = await RefreshTokenRepository.create(user.id);

    return { token, refreshToken, user: safeUser(user) };
  },

  /**
   * Revoke a specific refresh token on logout.
   * If no token is provided the call is a no-op (client-side logout still clears storage).
   */
  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const record = await RefreshTokenRepository.findValid(rawRefreshToken);
    if (record) {
      await RefreshTokenRepository.revoke(record.id);
    }
  },

  async getById(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }
    return safeUser(user);
  },
};
