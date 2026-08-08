# Devinedesk Site Reliability Runbooks

## Incident: High Latency / AI Timeout (HTTP 504)
**Symptoms:** Users report "Generation Failed" or loading spinners taking > 2 minutes. API Health checks show degraded state.
**Root Cause:** Usually an upstream provider (e.g. OpenAI, Stable Diffusion) is experiencing an outage or severe rate limits.
**Resolution:**
1. Check `/admin/health` to confirm Worker CPU usage is stable.
2. The custom `providerRouter.js` should automatically fallback to secondary providers. If the secondary provider is also failing, you must temporarily disable the specific model in the Super Admin Feature Flag dashboard (`/admin/features`).

## Incident: Redis Rate Limit Failure
**Symptoms:** `ioredis` throwing connection timeout errors. All API routes immediately fail with 500s.
**Root Cause:** Upstash Redis connection exhaustion.
**Resolution:**
1. Temporarily increase the maximum connection limit on the Upstash console.
2. Wait for the `apiHandler.js` to reconnect.

## Incident: Database Out of Memory
**Symptoms:** Postgres throws OOM kills. 
**Root Cause:** A heavy JSON query without the proper GIN index being utilized.
**Resolution:**
1. Do NOT restart the database mid-transaction.
2. Ensure you have run `npx prisma db push` so that the `@@index(..., type: Gin)` configurations are actually active in the Postgres instance.
