// Unit tests for AuthService — all database calls are mocked

jest.mock('../repositories/UserRepository');
jest.mock('../repositories/RefreshTokenRepository');
jest.mock('../middleware/auth');

import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';
import { signToken } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  roleId: 'role-1',
  role: { id: 'role-1', name: 'user', createdAt: new Date(), updatedAt: new Date() },
};

const MockUserRepository = UserRepository as jest.Mocked<typeof UserRepository>;
const MockRefreshTokenRepository = RefreshTokenRepository as jest.Mocked<typeof RefreshTokenRepository>;
const mockSignToken = signToken as jest.MockedFunction<typeof signToken>;

beforeEach(() => {
  mockSignToken.mockReturnValue('mock-access-token');
  MockRefreshTokenRepository.create.mockResolvedValue({ id: 'rt-1', rawToken: 'mock-refresh-token' });
});

// ─── register ─────────────────────────────────────────────────────────────────

describe('AuthService.register', () => {
  it('throws 409 when email is already in use', async () => {
    MockUserRepository.findByEmail.mockResolvedValue(mockUser);

    await expect(AuthService.register('test@example.com', 'password123', 'Test User'))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 500 when default role is missing', async () => {
    MockUserRepository.findByEmail.mockResolvedValue(null);
    MockUserRepository.findDefaultRoleId.mockResolvedValue(null);

    await expect(AuthService.register('new@example.com', 'password123', 'New User'))
      .rejects.toMatchObject({ statusCode: 500 });
  });

  it('returns token, refreshToken, and user on success', async () => {
    MockUserRepository.findByEmail.mockResolvedValue(null);
    MockUserRepository.findDefaultRoleId.mockResolvedValue('role-1');
    MockUserRepository.create.mockResolvedValue(mockUser);

    const result = await AuthService.register('new@example.com', 'password123', 'Test User');

    expect(result).toHaveProperty('token', 'mock-access-token');
    expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
    expect(result.user).toMatchObject({ email: 'test@example.com', name: 'Test User' });
  });

  it('splits name into firstName and lastName', async () => {
    MockUserRepository.findByEmail.mockResolvedValue(null);
    MockUserRepository.findDefaultRoleId.mockResolvedValue('role-1');
    MockUserRepository.create.mockResolvedValue({
      ...mockUser,
      firstName: 'Alex',
      lastName: 'Johnson',
    });

    const result = await AuthService.register('a@b.com', 'pass1234', 'Alex Johnson');
    expect(result.user.name).toBe('Alex Johnson');
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('AuthService.login', () => {
  it('throws 401 when user is not found', async () => {
    MockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(AuthService.login('unknown@example.com', 'pass'))
      .rejects.toMatchObject({ statusCode: 401, message: 'Invalid credentials' });
  });

  it('throws 401 when password is wrong', async () => {
    const userWithHash = { ...mockUser, passwordHash: await bcrypt.hash('correct-pass', 10) };
    MockUserRepository.findByEmail.mockResolvedValue(userWithHash);

    await expect(AuthService.login('test@example.com', 'wrong-pass'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns token, refreshToken, and user on valid credentials', async () => {
    const password = 'correct-pass';
    const userWithHash = { ...mockUser, passwordHash: await bcrypt.hash(password, 10) };
    MockUserRepository.findByEmail.mockResolvedValue(userWithHash);

    const result = await AuthService.login('test@example.com', password);

    expect(result.token).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
    expect(result.user.email).toBe('test@example.com');
  });
});

// ─── refresh ──────────────────────────────────────────────────────────────────

describe('AuthService.refresh', () => {
  it('throws 401 when refresh token is invalid', async () => {
    MockRefreshTokenRepository.findValid.mockResolvedValue(null);

    await expect(AuthService.refresh('bad-token'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('revokes old token and issues new pair on valid refresh token', async () => {
    MockRefreshTokenRepository.findValid.mockResolvedValue({ id: 'rt-1', userId: 'user-1', tokenHash: 'h', expiresAt: new Date(), revokedAt: null, createdAt: new Date() });
    MockRefreshTokenRepository.revoke.mockResolvedValue(undefined);
    MockUserRepository.findById.mockResolvedValue(mockUser);

    const result = await AuthService.refresh('valid-raw-token');

    expect(MockRefreshTokenRepository.revoke).toHaveBeenCalledWith('rt-1');
    expect(MockRefreshTokenRepository.create).toHaveBeenCalledWith('user-1');
    expect(result.token).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
  });

  it('throws 404 when user no longer exists after token lookup', async () => {
    MockRefreshTokenRepository.findValid.mockResolvedValue({ id: 'rt-1', userId: 'deleted-user', tokenHash: 'h', expiresAt: new Date(), revokedAt: null, createdAt: new Date() });
    MockRefreshTokenRepository.revoke.mockResolvedValue(undefined);
    MockUserRepository.findById.mockResolvedValue(null);

    await expect(AuthService.refresh('valid-token'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('AuthService.logout', () => {
  it('does nothing when no refresh token provided', async () => {
    await AuthService.logout();
    expect(MockRefreshTokenRepository.findValid).not.toHaveBeenCalled();
  });

  it('revokes the refresh token when provided', async () => {
    MockRefreshTokenRepository.findValid.mockResolvedValue({ id: 'rt-1', userId: 'user-1', tokenHash: 'h', expiresAt: new Date(), revokedAt: null, createdAt: new Date() });
    MockRefreshTokenRepository.revoke.mockResolvedValue(undefined);

    await AuthService.logout('valid-raw-token');

    expect(MockRefreshTokenRepository.revoke).toHaveBeenCalledWith('rt-1');
  });

  it('does not throw when refresh token is already expired', async () => {
    MockRefreshTokenRepository.findValid.mockResolvedValue(null);
    await expect(AuthService.logout('expired-token')).resolves.toBeUndefined();
  });
});

// ─── getById ──────────────────────────────────────────────────────────────────

describe('AuthService.getById', () => {
  it('throws 404 when user not found', async () => {
    MockUserRepository.findById.mockResolvedValue(null);

    await expect(AuthService.getById('bad-id'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns safe user object', async () => {
    MockUserRepository.findById.mockResolvedValue(mockUser);

    const result = await AuthService.getById('user-1');
    expect(result).toMatchObject({ id: 'user-1', email: 'test@example.com' });
    expect(result).not.toHaveProperty('passwordHash');
  });
});
