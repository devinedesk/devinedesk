# Database Schema Overview

Devinedesk utilizes Prisma ORM on top of PostgreSQL.

## Core Models

### Identity & Access
- `User`: Global user accounts.
- `Organization`: Top-level billing and team grouping.
- `Workspace`: Sub-environments within an Organization for strict isolation.
- `OrganizationMember` / `WorkspaceMember`: Join tables defining `OrgRole` (OWNER, ADMIN, MEMBER) and `WorkspaceRole`.

### Assets & Workflows
- `Workflow`: A node-based graph structure stored as heavily indexed JSON (`nodes`, `edges`).
- `Generation`: Individual AI jobs (Text-to-Image, Text-to-Video).
- `Asset`: Persistent file storage metadata mapped to S3 URLs.

### Billing & Telemetry
- `Transaction`: Credit ledger entries (purchases and usage).
- `Subscription`: Stripe subscription states.
- `AuditLog`: Immutable history of all critical actions (login, delete, invite).
- `ModelUsage`: High-precision analytics on token usage and cost per generation.

## Schema Modifications
To update the schema:
1. Modify `prisma/schema.prisma`.
2. Run `npx prisma format` to lint.
3. Run `npx prisma db push` (for local prototyping) or `npx prisma migrate dev` (to generate SQL migration files for production).
4. Run `npm run generate` to rebuild the TypeScript Prisma Client.

## Indexing Strategy
We use **PostgreSQL GIN indexes** via `@@index([parameters], type: Gin)` on all `Json` fields (e.g. `Workflow.nodes`, `Generation.parameters`, `Asset.metadata`) to allow sub-millisecond querying over deeply nested, unstructured configurations.
