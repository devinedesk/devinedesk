import { z } from 'zod';

// User & Profile
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
});

// Authentication & Passwords
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

// Organizations & Invites
export const organizationInviteSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

// Billing
export const checkoutSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
});

// Admin Actions
export const adminActionSchema = z.object({
  action: z.enum(['BAN', 'UNBAN', 'DELETE', 'RESET_QUOTA', 'DELETE_WORKSPACE', 'GRANT_CREDITS']),
  targetUserId: z.string().uuid('Invalid target user ID'),
});

// Missing schemas for tests
export const userUpdateSchema = z.object({
  name: z.string().min(3),
  image: z.string().url().optional(),
});

export const orgUpdateSchema = z.object({
  name: z.string().min(1),
  billingEmail: z.string().email().optional(),
});

export const webhookCreateSchema = z.object({
  url: z
    .string()
    .url()
    .refine((url) => url.startsWith('https://'), { message: 'Must be HTTPS' }),
  events: z.array(z.string()).min(1),
});
