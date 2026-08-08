# Devinedesk Architecture Overview

## Core Stack
Devinedesk is an enterprise-grade SaaS application built on a highly scalable, modern monorepo stack:
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript/JavaScript (ES6+)
- **Database:** PostgreSQL (via Prisma ORM)
- **Styling:** Tailwind CSS + Radix UI + Lucide Icons
- **Background Jobs:** BullMQ + Upstash Redis
- **AI Routing:** Custom Multi-Provider Fallback Router (OpenRouter, FalAI, AIMLAPI)
- **Authentication:** Custom JWT / Magic Link / Credentials (with Zod validation)

## System Topology
1. **Edge CDN (Vercel)**: Terminates SSL, caches static assets, handles global routing.
2. **Next.js Server (Node.js/Edge)**: Handles SSR, API Routes, and Trpc endpoints. 
3. **Database Layer**: PostgreSQL handles all persistent state with highly optimized GIN indices on large JSON blocks.
4. **Queue Worker (BullMQ)**: A standalone Node.js process (`src/worker.js`) asynchronously processes long-running AI generation jobs to prevent HTTP timeout limitations.

## Key Design Patterns
- **API First:** Every feature (billing, workflows, generations, users) is decoupled into standard REST/RPC API routes.
- **Provider Agnostic AI:** `src/lib/providerRouter.js` acts as an abstraction layer so the platform can seamlessly swap between LLM and Image generation models if one goes down.
- **Role-Based Access Control (RBAC):** Middleware and API handlers enforce strict access limits via `OrgRole` (OWNER, ADMIN, MEMBER) and `WorkspaceRole`.
- **Soft Deletions:** Transactional data is never hard-deleted. We use `deletedAt` timestamps for compliance and auditability.

## Observability & Tracing
- **OpenTelemetry/Sentry:** Integrated into the BullMQ workers and API routes to track latency, errors, and performance bottlenecks via distributed traces.
- **Prometheus/Grafana:** Available via `prom-client` metrics export.

## Deployment Strategy
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for details on CI/CD and hosting.
