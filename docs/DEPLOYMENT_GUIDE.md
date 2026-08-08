# Devinedesk Deployment Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis (Upstash recommended)
- Stripe Account
- OpenAI/OpenRouter Account

## Vercel Deployment (Recommended)
1. Fork or clone the repository to your GitHub account.
2. Link the repository to a new Vercel project.
3. In Vercel, set the Framework Preset to **Next.js**.
4. Configure the following critical environment variables:
   - `DATABASE_URL` (Direct connection for Prisma)
   - `REDIS_URL` (Upstash connection for rate limiting & queueing)
   - `NEXTAUTH_SECRET` (OpenSSL generated hex string)
   - `STRIPE_SECRET_KEY`
5. Vercel will automatically run `npm run build`, which triggers `prisma generate`.
6. Push to `main` to trigger the production deployment.

## Docker Deployment (Self-Hosted)
Devinedesk can be containerized. Ensure you build the image with the Prisma client generated.
```dockerfile
# Example Dockerfile Snippet
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["npm", "start"]
```

## BullMQ Worker
For production environments, Vercel Serverless Functions have a maximum timeout (usually 10-60s). Because AI generations can take longer, the queue processor must be run as a standalone long-lived process:
`node src/worker.js`
Deploy this on Render, Railway, or AWS ECS as a background worker.
