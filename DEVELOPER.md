# Developer Guide

Welcome to the DevineDesk V2 development environment. This guide will help you onboard into the architecture, best practices, and local development flows.

## Core Stack

- **Frontend**: Next.js 15 App Router, React, Tailwind CSS ("The Unbound Darkroom" aesthetic)
- **Backend APIs**: Next.js API Routes (`app/api/*`)
- **Database**: Prisma ORM (SQLite for local dev, PostgreSQL for production)
- **AI Integration**: Python FastAPI Backend (runs on `localhost:8000`)
- **Payments**: Stripe Checkout and Webhooks

## Local Setup

1. **Environment Variables**:
   Copy `.env.example` to `.env` and `.env.local` and populate the necessary secrets (Stripe, NextAuth, OpenAI, etc.).

2. **Database Initialization**:

   ```bash
   npx prisma generate
   npx prisma db push # Or prisma migrate dev for SQLite
   ```

3. **Running the Application**:
   - Web Client: `npm run dev` (starts on port 3000)
   - Python Backend: Ensure the FastAPI service is running on `localhost:8000`.

## Architecture Principles

### 1. No Client-Side Secrets (No BYOK)

Never pass API keys from the browser. All media generation (Image, Video, Audio) is routed through `/api/generate` where the server securely injects `.env` keys and deducts NextAuth user credits.

### 2. Database Syncing for State

Avoid dumping transient UI states into `localStorage`. We use `useDatabaseSync` and the `/api/state` endpoint to persist component states securely into the Prisma `Setting` model.

### 3. Unified UI Pattern

If you are building a new Studio, extend the `StudioGallery` and `EmptyStateHero` components. Do not build bespoke grid layouts unless you have a specific UX requirement (e.g., `ClippingStudio` timelines or `AudioStudio` waveforms).

## Code Quality Standards

- **Linting**: Ensure all code passes `npm run lint`.
- **Testing**: Write unit tests for new utility functions and run `npm run test:all` before opening a pull request.
- **Dead Code**: Remove any unused hooks, contexts, or database schemas. Do not leave placeholder API routes.
