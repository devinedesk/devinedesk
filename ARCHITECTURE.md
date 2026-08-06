# Architecture

DevineDesk uses a modern Next.js + Prisma architecture deployed alongside an Electron wrapper for desktop capabilities.

## High-Level Diagram

```mermaid
graph TD
    UI[Frontend (React/Tailwind)] --> Proxy[Next.js API Routes]
    Proxy --> DB[(Prisma/SQLite or PostgreSQL)]
    Proxy --> External[Stripe & External AI APIs]
    Proxy --> PythonBackend[FastAPI Agent Backend]
```

## Layers
1. **Frontend**: React components in `packages/studio`, utilizing `SettingsContext` and `useDatabaseSync` for optimistic UI. The UI strictly adheres to the "Unbound Darkroom" aesthetic.
2. **Backend**: Next.js App Router API endpoints (`/api/generate`, `/api/billing`, `/api/upload`, `/api/workflow`) providing a secure boundary. NextAuth handles session authentication and credit deduction.
3. **Database**: Prisma ORM, seamlessly managing users, credits, media uploads, and UI states.
4. **Payments**: Production Stripe integration validating webhook signatures for secure credit top-ups.

## Key Changes in V2
- Eliminated all client-side BYOK (Bring Your Own Keys) mocks in favor of secure `.env` server execution.
- Replaced dummy API polling with synchronous Next.js backend resolutions and secure proxy routes.
- Consolidated API logic out of individual components into single-responsibility API routes.
- Integrated full Stripe production hooks for monetization.
