import prisma from '../prisma.js';

export class BillingService {
  /**
   * Instantly deducts credits and records history (useful for synchronous workflows).
   */
  static async recordUsageAndHistory(userId, cost, type, prompt, model, parameters, resultUrl) {
    if (!userId) throw new Error('User ID is required to record billing.');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.credits < cost) throw new Error('Insufficient credits');

    const [updatedUser, transaction, generation] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost } },
      }),
      prisma.transaction.create({
        data: {
          userId: userId,
          amount: -cost,
          type: 'usage',
          description: `Usage: ${type}`,
        },
      }),
      prisma.generation.create({
        data: {
          userId: userId,
          type: type,
          prompt: prompt || null,
          model: model || null,
          parameters:
            typeof parameters === 'string' ? JSON.parse(parameters || '{}') : parameters || {},
          resultUrl: resultUrl || null,
          status: 'completed',
        },
      }),
    ]);

    return { user: updatedUser, transaction, generation };
  }

  /**
   * Deducts credits immediately when a job is queued.
   */
  static async queueGeneration(userId, cost, action) {
    if (!userId) throw new Error('User ID is required.');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.credits < cost) throw new Error('Insufficient credits. Please top up.');

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: -cost,
          type: 'usage',
          description: `Generation usage (queued): ${action}`,
        },
      }),
    ]);
    return updatedUser;
  }

  /**
   * Records a successful generation job and notifies the user.
   */
  static async finalizeSuccessfulGeneration(userId, action, prompt, model, parameters, resultUrl) {
    if (!userId) return;
    const recordsToCreate = [
      prisma.notification.create({
        data: {
          userId,
          title: 'Generation Complete',
          message: `Your ${action} request has finished.`,
          type: 'success',
        },
      }),
    ];

    if (action !== 'execute-workflow') {
      const generationId = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(7);
      recordsToCreate.push(
        prisma.generation.create({
          data: {
            id: generationId,
            userId,
            type: action,
            prompt: prompt || '',
            model: model || action,
            parameters:
              typeof parameters === 'string' ? JSON.parse(parameters || '{}') : parameters || {},
            resultUrl: resultUrl || '',
            status: 'completed',
          },
        })
      );

      // Phase 12/20: Track precise Model Usage for Analytics & Quotas
      recordsToCreate.push(
        prisma.modelUsage.create({
          data: {
            userId,
            generationId,
            model: model || action,
            provider: 'router',
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            costInCents: 5.0, // Standardized flat rate proxy
          },
        })
      );
    }

    await prisma.$transaction(recordsToCreate);
  }

  /**
   * Refunds credits, records the failure, and notifies the user.
   */
  static async refundFailedGeneration(userId, cost, action, prompt, model, parameters) {
    if (!userId) return;

    const recordsToCreate = [];

    if (action !== 'execute-workflow') {
      recordsToCreate.push(
        prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: cost } },
        })
      );
      recordsToCreate.push(
        prisma.transaction.create({
          data: {
            userId,
            amount: cost,
            type: 'refund',
            description: `Refund for failed generation: ${action}`,
          },
        })
      );
      recordsToCreate.push(
        prisma.generation.create({
          data: {
            userId,
            type: action,
            prompt: prompt || '',
            model: model || action,
            parameters:
              typeof parameters === 'string' ? JSON.parse(parameters || '{}') : parameters || {},
            resultUrl: '',
            status: 'failed',
          },
        })
      );
    }

    recordsToCreate.push(
      prisma.notification.create({
        data: {
          userId,
          title: 'Generation Failed',
          message: `Your ${action} request failed. ${action !== 'execute-workflow' ? `(+${cost} credits refunded)` : ''}`,
          type: 'error',
        },
      })
    );

    await prisma.$transaction(recordsToCreate);
  }

  /**
   * Adds credits to a user (e.g., from Stripe webhook).
   */
  static async addCredits(userId, amount, description, stripePaymentId = null) {
    if (!userId) throw new Error('User ID is required to add credits.');

    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount,
          type: 'purchase',
          description,
          stripePaymentId,
        },
      }),
    ]);

    return { user: updatedUser, transaction };
  }

  /**
   * Checks if a transaction has already been processed by checking the stripe payment ID
   */
  static async checkTransactionProcessed(stripePaymentId) {
    if (!stripePaymentId) return false;
    const existingTransaction = await prisma.transaction.findFirst({
      where: { stripePaymentId },
    });
    return !!existingTransaction;
  }
}
