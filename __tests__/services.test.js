import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../src/lib/services/userService';
import { GenerationService, processGenerationRequest } from '../src/lib/services/generationService';
import { BillingService } from '../src/lib/services/billingService';
import prisma from '../src/lib/prisma';

// Mock prisma
vi.mock('../src/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    generation: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((cb) => {
      if (typeof cb === 'function') {
        return cb({
          user: { update: vi.fn() },
          transaction: { create: vi.fn() },
          setting: { upsert: vi.fn() },
        });
      }
      return cb; // for array-based transactions
    }),
  },
}));

// Mock generationService internal models to avoid actual adapter loads
vi.mock('@/packages/studio/src/models.js', () => ({
  getModelById: vi.fn().mockReturnValue({ provider: 'mock' }),
}));

vi.mock('@/src/lib/providerRouter.js', () => ({
  getAdapterForModel: vi.fn().mockReturnValue({
    generateImage: vi.fn().mockResolvedValue({ id: 'mock-gen-1', resultUrl: 'mock-url' }),
  }),
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find user by email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
    const user = await UserService.getUserByEmail('test@test.com');
    expect(user).toEqual({ id: '1', email: 'test@test.com' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
  });

  it('should get credits successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', credits: 40 });
    const credits = await UserService.getCredits('1');
    expect(credits).toBe(40);
  });
});

describe('GenerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process an image generation request via mock adapter', async () => {
    const result = await processGenerationRequest(
      'generateImage',
      { model: 'test' },
      { openrouterKey: 'key' }
    );
    expect(result.resultUrl).toBe('mock-url');
  });
});

describe('BillingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add credits and create transaction', async () => {
    prisma.$transaction.mockResolvedValue([
      { id: '1', credits: 500 },
      { id: 'tx1', amount: 500 },
    ]);

    const res = await BillingService.addCredits('1', 500, 'purchase', 'stripe-123');
    expect(res.user.credits).toBe(500);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should check if transaction was processed', async () => {
    prisma.transaction.findFirst.mockResolvedValue({ id: 'tx1', stripePaymentId: 'stripe-123' });
    const processed = await BillingService.checkTransactionProcessed('stripe-123');
    expect(processed).toBe(true);
  });
});
