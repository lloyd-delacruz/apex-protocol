import crypto from 'crypto';
import prisma from '../db/prisma';

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export const RefreshTokenRepository = {
  /**
   * Create a new refresh token for a user.
   * Returns the raw (unhashed) token to send to the client.
   * Only the hash is persisted.
   */
  async create(userId: string, expiresInDays = 30): Promise<{ id: string; rawToken: string }> {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const record = await prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { id: record.id, rawToken };
  },

  /**
   * Look up a refresh token by its raw value.
   * Returns null if the token does not exist, is revoked, or has expired.
   */
  async findValid(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  },

  /**
   * Revoke a single refresh token by its database ID.
   */
  async revoke(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  /**
   * Revoke all active refresh tokens for a user (e.g. on forced logout).
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
