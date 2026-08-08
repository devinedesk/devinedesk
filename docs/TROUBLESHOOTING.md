# Troubleshooting

Common issues and their resolutions for DevineDesk operations.

## 1. Database Connection Errors (`P1001`)
**Symptom:** Next.js throws a Prisma error indicating it cannot reach the database.
**Fix:**
- Ensure `DATABASE_URL` is correctly formatted in `.env.local`.
- If using Docker, verify the postgres container is running: `docker ps`.
- Check if the database requires SSL by appending `?sslmode=require` to the URL.

## 2. BullMQ Workers Not Processing
**Symptom:** AI generation jobs remain in `PROCESSING` indefinitely.
**Fix:**
- Verify `REDIS_URL` is correct.
- Ensure the background worker process is running (`npm run worker`).
- Check if Redis has hit its memory limit (especially if using a free Upstash tier).

## 3. Stripe Webhooks Failing
**Symptom:** Users purchase credits but their balance does not update.
**Fix:**
- Ensure you have forwarded Stripe webhooks to your local environment: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
- Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output in `.env.local`.

## 4. Rate Limiting Issues (HTTP 429)
**Symptom:** Valid API requests are immediately rejected with 429 Too Many Requests.
**Fix:**
- Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are populated. Rate limiting fails closed if Redis is inaccessible.
- For local dev, you can disable rate limiting by commenting out the `RateLimitService` checks in `src/lib/apiHandler.js`.
