# Developer Guide

Welcome to the Devinedesk engineering team!

## Local Setup
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Duplicate `.env.example` to `.env` and fill in the required external API keys (Stripe, OpenRouter, Upstash).
4. Spin up a local PostgreSQL instance (e.g. using Docker: `docker run --name pg -e POSTGRES_PASSWORD=pass -p 5434:5432 -d postgres`).
5. Run `npx prisma db push` to push the schema to your local DB.
6. Run `node prisma/seed.js` to automatically populate 25+ models with mock data (including Admin and User accounts).
7. Start the Next.js dev server: `npm run dev`.
8. Start the local background worker in a separate terminal: `node src/worker.js`.

## Code Guidelines
- **Strict Typing:** All new features must be implemented in TypeScript/ES6+ with extensive JSDoc comments.
- **Validation:** Always use Zod schemas in API routes before processing mutations.
- **Styling:** We use Tailwind CSS. Use `cn()` from `@/lib/utils` for conditional class merging. Do not write vanilla CSS.

## Testing
- We use **Vitest** for unit testing: `npm run test`
- For coverage metrics: `npm run test -- --coverage`
- We use **Playwright** for E2E testing: `npx playwright test`
