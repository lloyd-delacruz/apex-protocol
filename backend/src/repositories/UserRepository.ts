import prisma from '../db/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const UserRepository = {
  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { role: true },
    });
  },

  async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });
  },

  async create(data: CreateUserInput) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: data.roleId,
      },
      include: { role: true },
    });
  },

  async findDefaultRoleId() {
    const role = await prisma.role.findUnique({ where: { name: 'user' } });
    return role?.id ?? null;
  },
};
