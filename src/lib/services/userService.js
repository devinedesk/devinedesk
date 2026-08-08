import prisma from '@/src/lib/prisma';

export class UserService {
  /**
   * Gets a user by ID
   */
  static async getUserById(userId) {
    if (!userId) return null;
    return prisma.user.findUnique({ where: { id: userId } });
  }

  /**
   * Gets a user by email
   */
  static async getUserByEmail(email) {
    if (!email) return null;
    return prisma.user.findUnique({ where: { email } });
  }

  /**
   * Creates a new user
   */
  static async createUser(data) {
    return prisma.user.create({ data });
  }

  /**
   * Updates the user's Stripe customer ID
   */
  static async setStripeCustomerId(userId, stripeCustomerId) {
    if (!userId || !stripeCustomerId) return null;
    return prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });
  }

  /**
   * Gets a user profile (safe fields only)
   */
  static async getUserProfile(userId) {
    if (!userId) return null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        image: true,
        referralCode: true,
        twoFactorEnabled: true,
        settings: {
          where: { key: 'bio' },
          select: { value: true },
        },
      },
    });
    if (!user) return null;

    return {
      ...user,
      bio: user.settings?.[0]?.value || '',
    };
  }

  /**
   * Updates a user profile and settings
   */
  static async updateProfile(userId, { name, bio, image }) {
    if (!userId) return null;

    return prisma.$transaction(async (tx) => {
      const dataToUpdate = {};
      if (name !== undefined) dataToUpdate.name = name;
      if (image !== undefined) dataToUpdate.image = image;

      const user = await tx.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });

      if (bio !== undefined) {
        await tx.setting.upsert({
          where: { userId_key: { userId, key: 'bio' } },
          update: { value: bio },
          create: { userId, key: 'bio', value: bio },
        });
      }

      return user;
    });
  }

  /**
   * Gets user credits
   */
  static async getCredits(userId) {
    const user = await this.getUserById(userId);
    return user ? user.credits : 0;
  }

  /**
   * Gets user history
   */
  static async getHistory(userId, limit = 50) {
    if (!userId) return [];
    return prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Deletes user history
   */
  static async deleteHistory(userId, id = null) {
    if (!userId) return;
    const where = { userId };
    if (id) where.id = id;
    return prisma.generation.deleteMany({ where });
  }

  /**
   * Gets user transactions
   */
  static async getTransactions(userId, limit = 50) {
    if (!userId) return [];
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
