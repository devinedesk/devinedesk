import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService } from '../src/lib/services/billingService';
import prisma from '../src/lib/prisma';

// Mock the prisma client
vi.mock('../src/lib/prisma', () => {
  return {
    default: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      transaction: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      generation: {
        create: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
      modelUsage: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (ops) => Promise.all(ops)),
    },
  };
});

describe('BillingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordUsageAndHistory', () => {
    it('should throw if userId is not provided', async () => {
      await expect(BillingService.recordUsageAndHistory(null, 10, 't2i')).rejects.toThrow(
        'User ID is required to record billing.'
      );
    });

    it('should throw if user has insufficient credits', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'user_1', credits: 5 });
      await expect(BillingService.recordUsageAndHistory('user_1', 10, 't2i')).rejects.toThrow(
        'Insufficient credits'
      );
    });

    it('should process billing successfully', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'user_1', credits: 100 });
      prisma.user.update.mockResolvedValueOnce({ id: 'user_1', credits: 90 });
      prisma.transaction.create.mockResolvedValueOnce({ id: 'tx_1' });
      prisma.generation.create.mockResolvedValueOnce({ id: 'gen_1' });

      const result = await BillingService.recordUsageAndHistory(
        'user_1',
        10,
        't2i',
        'prompt',
        'model_1',
        {},
        'url'
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.user.credits).toBe(90);
    });
  });

  describe('queueGeneration', () => {
    it('should deduct credits when queuing', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'user_2', credits: 50 });
      prisma.user.update.mockResolvedValueOnce({ id: 'user_2', credits: 40 });

      const result = await BillingService.queueGeneration('user_2', 10, 'queue-action');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.credits).toBe(40);
    });
  });

  describe('addCredits', () => {
    it('should increment user credits and record purchase transaction', async () => {
      prisma.user.update.mockResolvedValueOnce({ id: 'user_3', credits: 100 });
      prisma.transaction.create.mockResolvedValueOnce({ id: 'tx_buy' });

      const result = await BillingService.addCredits('user_3', 100, 'Topup', 'stripe_tx');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.user.credits).toBe(100);
    });
  });
});
