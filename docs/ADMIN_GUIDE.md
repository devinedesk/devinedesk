# DevineDesk Admin Guide

Welcome to the Admin Guide for DevineDesk. This document outlines how to manage the platform, users, and infrastructure.

## 1. Accessing the Admin Dashboard
Navigate to `/admin` and log in with an account that has `ADMIN` or `SUPER_ADMIN` role.

## 2. User Management
- **Ban/Suspend Users**: From the Users tab, you can suspend accounts.
- **Role Assignment**: Only Super Admins can promote regular users to Admin.

## 3. Feature Flags
- Go to **Settings > Feature Flags** to enable or disable experimental features globally or for specific environments.

## 4. Audit Logs
- Monitor all sensitive actions across the platform in the **Settings > Audit Logs** panel.

## 5. Security & Infrastructure
- API Rate limits are configured via Redis. To override limits for specific endpoints, adjust the `rateLimitOverride` in the `withApiAuth` wrapper.
- All secrets must be securely managed via environment variables. Do not commit `.env.local` to the repository.
