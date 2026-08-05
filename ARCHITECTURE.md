# Architecture

DevineDesk uses a modern Next.js + Prisma architecture deployed alongside an Electron wrapper for desktop capabilities.

## High-Level Diagram

```mermaid
graph TD
    UI[Frontend (React/Tailwind)] --> Proxy[Next.js API Routes]
    Proxy --> DB[(Prisma/SQLite)]
    Proxy --> External[External AI APIs]
```

## Layers
1. **Frontend**: React components in `packages/studio`, utilizing `SettingsContext` and `useDatabaseSync` for optimistic UI.
2. **Backend**: Next.js App Router API endpoints (`/api/generate`, `/api/settings`, `/api/state`) providing a secure boundary.
3. **Database**: Prisma ORM with SQLite, chosen for seamless portability across local web environments and packaged Electron desktop apps.

## Key Changes in V2
- Shifted from pure client-side `localStorage` state management to a unified Next.js + Database layer.
- Consolidated API logic out of individual components into single-responsibility API routes.
