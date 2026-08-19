import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/db";
import { env } from "./env.js";
import { sendEmail } from "./lib/email.js";

const socialProviders =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

// Email verification is enabled only when SMTP is fully configured.
// In dev (no SMTP), email/password users can sign in without verifying.
const smtpConfigured = !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);

// When the API is served over HTTPS the frontend may live on a different
// registrable domain than the API (e.g. app.devinedesk.com calling
// api.devinedesk.com), so session cookies must be SameSite=None; Secure to be sent
// cross-site. On http (local dev) keep the default (Lax) since None requires Secure.
const useCrossSiteCookies = env.BACKEND_URL.startsWith("https://");

export const auth = betterAuth({
  baseURL: env.BACKEND_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Require email verification only when SMTP is configured (production).
    // In dev without SMTP, users can sign in immediately.
    requireEmailVerification: smtpConfigured,
    // Password reset callback — always registered so the endpoint exists.
    // When SMTP isn't configured, sendEmail() logs a warning and returns false.
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your DevineDesk password",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Reset your password</h2>
            <p style="color: #555;">We received a request to reset your DevineDesk password. Click the button below to choose a new one:</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="display: inline-block; background: #84cc16; color: #1a1a1a; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none;">Reset password</a>
            </p>
            <p style="color: #999; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email. This link will expire soon.</p>
          </div>
        `,
        text: `Reset your DevineDesk password: ${url}`,
      });
    },
  },
  // Email verification is a top-level option in better-auth (not inside
  // emailAndPassword). Always registered so the endpoint exists; sendEmail()
  // is a no-op when SMTP isn't configured.
  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your DevineDesk account",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Welcome to DevineDesk</h2>
            <p style="color: #555;">Please verify your email address to activate your account:</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="display: inline-block; background: #84cc16; color: #1a1a1a; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none;">Verify email</a>
            </p>
            <p style="color: #999; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
        text: `Welcome to DevineDesk. Verify your email: ${url}`,
      });
    },
  },
  socialProviders,
  // Allow a user who signed up with email/password to later sign in with
  // Google (and vice-versa) when the email matches. Without this, better-auth
  // returns "account_not_linked" on the first Google sign-in for an existing
  // email/password user.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["email-password", "google"],
      // When SMTP is configured, require email/password users to be verified
      // before linking Google. In dev (no SMTP), skip this check.
      requireLocalEmailVerified: smtpConfigured,
    },
  },
  // env.FRONTEND_URL is a list of allowed origins (multiple domains).
  trustedOrigins: env.FRONTEND_URL,
  ...(useCrossSiteCookies
    ? {
        advanced: {
          defaultCookieAttributes: { sameSite: "none" as const, secure: true },
        },
      }
    : {}),
});

export type Session = typeof auth.$Infer.Session;
