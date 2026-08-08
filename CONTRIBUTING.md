# Contribution Guide

Welcome to the DevineDesk project! We are thrilled to have you contribute to our world-class SaaS application.

## Getting Started

1. **Clone the repository**: `git clone https://github.com/your-org/devinedesk.git`
2. **Install dependencies**: `npm install`
3. **Database Setup**: Run `npx prisma db push` to synchronize the schema.
4. **Environment Variables**: Copy `.env.example` to `.env.local` and populate necessary keys (Stripe, AI providers).
5. **Start Dev Server**: `npm run dev`

## Code Style & Standards

- **Linting**: Always ensure `npm run lint` passes without warnings. We strictly follow ESLint configuration for Next.js.
- **Testing**: All new features MUST include a Playwright E2E test (`npm run test:e2e`) and Vitest unit tests where logic is deeply complex (`npm run test`).
- **Commits**: We use Conventional Commits (e.g., `feat: added AI retries`, `fix: corrected auth gate`).
- **PRs**: All Pull Requests must pass the automated GitHub Actions CI/CD pipelines before being reviewed by a core maintainer.

## Workflow Execution Architecture

When modifying `src/lib/services/workflowEngine.js`, keep in mind:

- Never break the `withRetry` logic wrapper; it is fundamental to API resiliency.
- All database mutations must utilize Prisma transactions if dealing with billing deductions and history writing simultaneously.

Thank you for contributing to DevineDesk!
