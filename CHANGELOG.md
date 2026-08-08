# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - Platform Refactor

### Added

- **Stripe Integration**: Added full production webhook handlers and NextAuth credit tracking for premium usage.
- **Unified Uploads**: Created `/api/upload` endpoint directly interfacing with Prisma `Asset` database model.
- **Backend Architecture**: Connected Next.js UI directly with Python FastAPI backend agent system (`/api/v1/creative-agent`).

### Changed

- **UI Design System**: Unified all Studio components (Image, Video, Marketing, Recast, etc.) to use "The Unbound Darkroom" aesthetic (Deep black `#030303` / Neon `#22d3ee`).
- **State Management**: Migrated away from localStorage `SettingsContext` dependency into database-backed session state via `useDatabaseSync`.
- **Database Schema**: Expanded Prisma from isolated local execution (SQLite) to scale out for production (PostgreSQL), adding Workflow, Transactions, and Agents models.

### Removed

- **BYOK (Bring Your Own Keys)**: Removed all insecure client-side input for OpenRouter, HuggingFace, Cloudinary. These now resolve securely via backend `.env` validation.
- **Global Requests Polling**: Replaced `global.requests` mock memory leak architecture with asynchronous Next.js proxies.
- **Dead Code**: Stripped incomplete `Notification` Prisma models and their corresponding frontend contexts.
