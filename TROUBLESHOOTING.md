# Troubleshooting Guide

## Workflow Execution Failures

**Symptom**: Nodes in the studio are constantly turning red and outputting "Generation Failed".
**Resolution**:

1. Check `/app/dashboard/analytics/page.js` to see the global error rate.
2. The `workflowEngine.js` has exponential backoff (`withRetry`). If it's failing entirely, it means the API is consistently returning `400 Bad Request` or it exhausted all retry limits (3).
3. Ensure the AI Provider API keys (OpenRouter / AIMLAPI) in the `.env` file are valid and possess active credits.

## Prisma Schema Out of Sync

**Symptom**: `Invalid `prisma.user.findUnique()` invocation` or similar column missing errors.
**Resolution**:
Run `npx prisma db push` or `npx prisma migrate dev` locally. If on production, ensure the CI/CD pipeline triggered `prisma generate` and applied migrations successfully.

## E2E Tests Failing on CI

**Symptom**: `npm run test:e2e` fails on GitHub Actions but passes locally.
**Resolution**:
Ensure Playwright browsers are installed in the pipeline (`npx playwright install --with-deps`). Verify that the CI environment has all mocked `.env.test` secrets populated so NextAuth can boot properly.
