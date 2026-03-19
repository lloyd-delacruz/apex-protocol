import prisma from '../db/prisma';

/**
 * ProfileService handles the persistence of user-specific onboarding data,
 * equipment setups, and lifestyle preferences.
 */
export const ProfileService = {
  /** Get full onboarding profile including equipment */
  async getOnboardingProfile(userId: string) {
    return prisma.onboardingProfile.findUnique({
      where: { userId },
      include: { 
        equipmentProfiles: { 
          include: { items: true } 
        } 
      },
    });
  },

  /** 
   * Upsert onboarding profile and associated equipment.
   * This is called during and after the onboarding flow.
   */
  async upsertOnboardingProfile(userId: string, data: any) {
    const { equipment, ...profileData } = data;
    
    return prisma.$transaction(async (tx) => {
      // 1. Upsert the base onboarding record
      const profile = await tx.onboardingProfile.upsert({
        where: { userId },
        create: { ...profileData, userId },
        update: profileData,
      });

      // 2. Handle Equipment Profile if provided
      if (equipment && Array.isArray(equipment)) {
        // Find existing default or create new
        let eqProfile = await tx.equipmentProfile.findFirst({
          where: { userId, isDefault: true },
        });

        if (!eqProfile) {
          eqProfile = await tx.equipmentProfile.create({
            data: {
              userId,
              onboardingProfileId: profile.id,
              name: 'Default Equipment',
              isDefault: true,
            },
          });
        } else {
          eqProfile = await tx.equipmentProfile.update({
            where: { id: eqProfile.id },
            data: { onboardingProfileId: profile.id },
          });
        }

        // 3. Replace equipment items (normalized sync)
        await tx.equipmentProfileItem.deleteMany({
          where: { equipmentProfileId: eqProfile.id },
        });

        if (equipment.length > 0) {
          await tx.equipmentProfileItem.createMany({
            data: equipment.map((code: string) => ({
              equipmentProfileId: eqProfile.id,
              equipmentCode: String(code).toLowerCase(),
              label: String(code).charAt(0).toUpperCase() + String(code).slice(1).replace(/_/g, ' '),
            })),
          });
        }
      }

      return profile;
    });
  },

  /** Upsert user-specific health/profile details */
  async upsertUserProfile(userId: string, data: any) {
    return prisma.userProfile.upsert({
      where: { userId },
      create: { ...data, userId },
      update: data,
    });
  },

  /** Get user settings / notification prefs */
  async getNotificationPreferences(userId: string) {
    return prisma.notificationPreference.findUnique({
      where: { userId },
    });
  },

  /** Update notification settings */
  async upsertNotificationPreferences(userId: string, data: any) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { ...data, userId },
      update: data,
    });
  },
};
