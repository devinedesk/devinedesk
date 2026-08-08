# V1 to V2 Migration Guide

This document outlines how to safely migrate your environment, database, and infrastructure from the V1 DevineDesk architecture (client-side state, BYOK) to the production V2 architecture (PostgreSQL, Stripe, server-side APIs).

## 1. Environment Variables

In V1, you provided API keys via the `ApiKeyModal` UI and they were saved to `localStorage`.
In V2, you must provide them securely on the server via `.env`:

1. Rename `.env.example` to `.env` or `.env.local`.
2. Map your previous keys (OpenRouter, HuggingFace, etc.) into this file.
3. Configure your `DATABASE_URL` (SQLite file path for dev, Postgres connection string for prod).
4. Provide `STRIPE_SECRET_KEY` and `NEXTAUTH_SECRET`.

## 2. Database Migration

The V2 schema introduces several new tables (`Asset`, `Transaction`, `Workflow`) and deletes dead schemas (`Notification`).

### Local Development (SQLite)

Run:

```bash
npx prisma migrate dev
```

This will apply the new SQL migrations and prune any removed columns/tables.

### Production (PostgreSQL)

Run:

```bash
npx prisma db push
```

_(Or your preferred CI/CD migration pipeline command)._

## 3. Stripe Billing Initialization

You must map your Stripe Products/Prices to the frontend. Ensure your webhook endpoint (`/api/billing/webhook`) is correctly registered in your Stripe Developer Dashboard to properly resolve credits upon purchase.

## 4. State Management

User settings and generation histories are no longer stored in `localStorage`. If users had unsaved generations in V1, they are not migrated. All future states are synced automatically via `/api/state` into the Prisma `Setting` and `Generation` schemas.
