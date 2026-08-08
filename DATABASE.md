# Database Documentation

DevineDesk uses **Prisma** with a **SQLite** database (`dev.db`) by default for local execution, or **PostgreSQL** for scalable serverless deployments (e.g. Vercel/Supabase).

## Schema Design

### Core

- **User**: Represents a local or authenticated NextAuth session. Tracks user role, credits, and Stripe customer ID.
- **Setting**: Stores flexible Key-Value pairs for configuration and UI state.
- **Asset**: Unified file storage table tracking uploaded images, videos, and audio.

### Generation & AI

- **Generation**: Centralized history of all AI outputs across all studios.
- **Workflow & WorkflowRun**: Node-based automation state and execution histories.
- **Agent, Conversation, Message**: Multi-turn AI chat and context.

### Billing

- **Transaction**: Tracks credit purchases, usage deductions, and Stripe webhooks for auditability.

## Migrations

Run `npx prisma migrate dev` to synchronize schema changes. Do not modify the database directly.
For production (Postgres), run `npx prisma db push` or apply migrations via CI/CD.
