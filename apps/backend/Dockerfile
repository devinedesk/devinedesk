# Backend image. Build context must be the repo root (monorepo workspace).
FROM oven/bun:1.3.11 AS base
WORKDIR /app

# ffmpeg is required to stitch template clips together + generate thumbnails.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies for the whole workspace (cached when manifests are unchanged).
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
RUN bun install

# Copy source.
COPY packages/db packages/db
COPY packages/typescript-config packages/typescript-config
COPY packages/eslint-config packages/eslint-config
COPY apps/backend apps/backend

# Generate the Prisma client.
RUN cd packages/db && bunx prisma generate

ENV NODE_ENV=production
EXPOSE 4000

# Apply pending Prisma migrations, then start the server.
# `prisma migrate deploy` applies committed migrations in order (production-safe).
# Run from packages/db so `bunx prisma` resolves the project's pinned Prisma (it's a
# dependency there) rather than fetching a newer, incompatible Prisma from npm.
# Under docker-compose, env vars are injected directly (no .env file needed).
# For k8s, mount a secret at /app/apps/backend/.env and it will be sourced first.
CMD ["sh", "-c", "if [ -f /app/apps/backend/.env ]; then set -a; . /app/apps/backend/.env; set +a; fi; cd /app/packages/db && bunx prisma migrate deploy && cd /app/apps/backend && bun src/index.ts"]
