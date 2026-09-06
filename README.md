# DevineDesk

[![Powered by Atlas Cloud](https://www.atlascloud.ai/oss-program/powered-by-atlas-cloud.svg)](https://www.atlascloud.ai/?ref=YOUR_INVITE_CODE)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A generative-media SaaS. Users sign in and can:

- **Generate videos** from a prompt with a choice of model, duration, resolution,
  aspect ratio, start/end frames and reference frames.
- **Generate images** from a prompt with a choice of model, resolution, aspect
  ratio and optional reference images.
- **Face swap** — upload a base image and a face, and get the face swapped in.

Video and image generation are routed through a configurable AI provider:
[OpenRouter](https://openrouter.ai/docs/guides/overview/multimodal/video-generation),
[Atlas Cloud](https://www.atlascloud.ai), or
[Vertex AI / Gemini Enterprise Agent Platform](https://cloud.google.com/vertex-ai)
— selected via the `AI_PROVIDER` env var. Face swaps run on a self-hosted
[FaceFusion](https://docs.facefusion.io) service. All generated media and
uploaded inputs are stored in an S3-compatible object store (MinIO).

## Architecture

This is a [Turborepo](https://turborepo.dev) monorepo managed with **bun**.

| Path                      | Description                                                                 |
| ------------------------- | --------------------------------------------------------------------------- |
| `apps/frontend`           | React + Vite + TypeScript SPA (Tailwind v4 + shadcn-style UI).              |
| `apps/backend`            | TypeScript + Express API. Auth (better-auth), OpenRouter + MinIO services.  |
| `packages/db`             | Prisma schema + client. Shared Postgres data layer reused by the backend.   |
| `packages/typescript-config` | Shared `tsconfig` presets.                                               |
| `packages/eslint-config`  | Shared ESLint config.                                                       |

Services (via `docker-compose.yml`):

- **Postgres** — primary database (Prisma).
- **MinIO** — local S3-compatible object store for videos, images & face swaps.
- **FaceFusion** — self-hosted face-swap HTTP service (`infra/facefusion`, behind a compose profile).
- **backend** / **frontend** — the application containers.

## Prerequisites

- [Docker](https://www.docker.com/) + Docker Compose
- [bun](https://bun.sh) `>= 1.3` (for local, non-Docker development)

## Quick start (everything in Docker)

```sh
# 1. Configure environment
cp .env.example .env
# (optional) add OPENROUTER_API_KEY and Google OAuth creds when you have them

# 2. Build & start the full stack
bun run docker:up        # docker compose up -d --build

# 3. Tail logs
bun run docker:logs
```

Once up:

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000 (health check at `/health`)
- MinIO console: http://localhost:9001 (user/pass from `.env`, default `minioadmin`)

Database migrations are applied automatically when the backend container starts.

Stop everything:

```sh
bun run docker:down          # stop containers
bun run docker:reset         # stop AND delete volumes (wipes DB + objects)
```

### Face swap (FaceFusion)

Face swapping requires the self-hosted FaceFusion service, which is **not started
by default** (the image is ~5GB and downloads models on first use). Start it with:

```sh
bun run docker:facefusion
# = docker compose --profile facefusion up -d --build facefusion
```

It exposes a small HTTP wrapper (`infra/facefusion`) around FaceFusion's
`headless-run` CLI at `http://localhost:7865/swap`. The backend reaches it via
the `FACEFUSION_URL` env var.

On first boot the container **pre-downloads the FaceFusion models** (lite scope,
which includes the face swapper) into the `facefusion_data` volume, so the models
persist across restarts and the first swap isn't slow. This initial download
takes a few minutes — the service reports healthy (and swaps work) once it
finishes. Subsequent starts skip the download via a marker file.

## Local development (apps on host, infra in Docker)

Run only Postgres + MinIO in Docker, and the apps on your machine with hot reload:

```sh
# 1. Start infra
bun run infra:up

# 2. Install deps
bun install

# 3. Configure per-app env
cp packages/db/.env.example packages/db/.env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
#   -> set BETTER_AUTH_SECRET in apps/backend/.env

# 4. Set up the database
bun run db:generate
bun run db:migrate      # apply Prisma migrations (creates the schema in Postgres)

# 5. Run all apps with hot reload
bun run dev
```

- Frontend dev server: http://localhost:5173
- Backend dev server: http://localhost:4000

## Environment variables

All secrets are configured via `.env` files. Copy each `.env.example` to `.env`
and fill in the values you have. The app runs without optional secrets (OpenRouter,
Google OAuth, SMTP, Dodo Payments) — those features just return errors or are
hidden until their keys are set. See the `.env.example` files for full
documentation:

- `.env.example` (root) — docker-compose variables
- `apps/backend/.env.example`
- `apps/frontend/.env.example`
- `packages/db/.env.example`

### Google OAuth

Create an OAuth client in Google Cloud Console and set the authorized redirect
URI to:

```
http://localhost:4000/api/auth/callback/google
```

For production, add the production redirect URI:

```
https://api.devinedesk.com/api/auth/callback/google
```

Also add the frontend origins (`http://localhost:5173`,
`https://devinedesk.com`, `https://www.devinedesk.com`) to the authorized
JavaScript origins.

### Dodo Payments

Create an account at [Dodo Payments](https://app.dodopayments.com/), then set:

- `DODO_PAYMENTS_API_KEY` — API key (Developer → API)
- `DODO_PAYMENTS_WEBHOOK_KEY` — webhook signing secret (Developer → Webhooks)
- `DODO_PRODUCT_IDS` — comma-separated product IDs for the Starter, Pro, and
  Studio credit packs (create these as one-time payment products)

The webhook URL should point to:

```
https://api.devinedesk.com/api/credits/webhook
```

### SMTP (email verification)

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` to
enable email verification for email/password sign-ups. Without these, email
verification is skipped (dev mode).

## Production deployment

The GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and pushes
Docker images to GitHub Container Registry (ghcr.io) on every push to `main`.
No external secrets required — it uses the automatically-provided `GITHUB_TOKEN`.
Ensure the repository has "Packages: write" permission for the workflow token
(Settings → Actions → General → Workflow permissions).

For production:

1. Set all environment variables in the deployment environment (or a production
   `.env`).
2. Set `BACKEND_URL` to `https://api.devinedesk.com`.
3. Set `FRONTEND_URL` to `https://devinedesk.com,https://www.devinedesk.com`.
4. Set `DODO_PAYMENTS_ENVIRONMENT` to `live_mode` (after Dodo business
   verification is approved).
5. Update the Dodo webhook URL to `https://api.devinedesk.com/api/credits/webhook`.
6. Configure DNS for `devinedesk.com`, `www.devinedesk.com`, and
   `api.devinedesk.com`.
7. Rotate all secrets before launch (they should never be reused from dev).

## Useful scripts

| Command                 | Description                                  |
| ----------------------- | -------------------------------------------- |
| `bun run docker:up`     | Build & start the full stack in Docker.      |
| `bun run docker:down`   | Stop the stack.                              |
| `bun run docker:reset`  | Stop the stack and delete volumes.           |
| `bun run docker:facefusion` | Build & start the FaceFusion face-swap service. |
| `bun run infra:up`      | Start only Postgres + MinIO.                 |
| `bun run dev`           | Run all apps locally with hot reload.        |
| `bun run build`         | Build all apps & packages.                   |
| `bun run check-types`   | Type-check the whole monorepo.               |
| `bun run db:migrate`    | Run Prisma migrations (dev).                 |
| `bun run db:deploy`     | Apply pending migrations (production).       |
| `bun run db:studio`     | Open Prisma Studio.                          |
