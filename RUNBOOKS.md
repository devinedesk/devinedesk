# DevOps Runbooks & Operations

This document defines standard operating procedures for the DevineDesk platform.

## Database Migrations

If the Prisma schema is updated (`prisma/schema.prisma`), follow this procedure:

1. `npx prisma format`
2. `npx prisma migrate dev --name <migration_name>`
3. `npx prisma generate`
4. Commit the newly generated `prisma/migrations` folder.

## Background Worker Queue Reset

If BullMQ tasks are hanging or the `worker.js` node crashes:

1. SSH into the production server.
2. Ensure the Redis instance is responsive: `redis-cli ping`
3. Restart the PM2 or Systemd process governing `npm run worker`.
4. Flush stuck jobs in Redis using BullMQ UI (if configured) or manually drop the queue keys if absolute clearance is required.

## Production Hotfixes

1. Branch from `main`.
2. Apply the fix.
3. Commit and open a PR.
4. Merge to `main`. The GitHub Actions CI/CD pipeline will automatically run the E2E Playwright tests and unit tests. If successful, it triggers a Vercel/Docker redeploy.
