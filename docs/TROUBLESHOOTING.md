# Troubleshooting DevineDesk

## Redis Connection Errors
If you see errors related to `@upstash/ratelimit` or `ioredis`, ensure your `REDIS_URL` environment variable is correctly set in `.env.local` or `.env`.
If running locally, ensure Redis is running:
```bash
docker-compose up -d redis
```

## Prisma Client Errors
If the application fails with "Prisma Client is not initialized" or missing fields, try regenerating the client:
```bash
npx prisma generate
```

## Build Failures
For OOM (Out of Memory) issues during Vercel builds, check `next.config.mjs` and optimize server packages.

## API Authentication Failures
If you are receiving 401s on API routes locally, ensure you are either passing a valid session token, or you have disabled the auth check for development testing.
