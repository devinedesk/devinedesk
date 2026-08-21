# AGENTS.md

Guidance for AI agents working in this repository.

## Project overview

DevineDesk is a generative-media SaaS (video + image generation and face swap).
It is a **bun**-managed **Turborepo** monorepo.

- `apps/frontend` — React + Vite + TypeScript SPA. Tailwind v4 + shadcn-style UI
  (components in `src/components/ui`). Auth via `better-auth/react`
  (`src/lib/auth-client.ts`). API calls in `src/lib/api.ts`. Routes: `/` (video),
  `/image`, `/face-swap`, `/user/templates`, `/user/avatar`,
  `/admin/template/create`. Each page reuses the create/library tab layout; shared
  bits live in `components/FileField.tsx` and `components/StatusBadge.tsx`.
  `src/lib/useMe.ts` loads `/api/me` (admin flag) to gate the admin nav link.
  The admin template creator uses a hand-built Premiere-style timeline in
  `components/timeline/` (`Timeline.tsx`, `BlockInspector.tsx`, `AudioClipInspector.tsx`,
  `TemplateSetupForm.tsx`). Templates start with an **empty timeline** (no fixed
  duration — it grows to fit the furthest clip). `Timeline.tsx` has video lanes
  (V1, V2, …) and audio lanes (A1, A2, …); both video blocks and audio clips can be
  dragged/cropped. A program monitor + play/pause/stop transport scrubs a playhead
  (rAF-driven) and previews each block's frames — or, if a block has been "baked"
  (or is an uploaded video), plays that clip — while every audio clip plays via a
  hidden `<audio>` element synced to the playhead (an in-browser mix preview).
- `apps/backend` — TypeScript + Express API. Run directly with **bun** (no build step).
  - `src/auth.ts` — better-auth (email/password + Google), Prisma adapter.
    Account linking is enabled (`account.accountLinking.enabled: true`) with
    `trustedProviders: ["email-password", "google"]` and
    `requireLocalEmailVerified` set based on SMTP config. Email verification
    (`emailVerification.sendVerificationEmail`) is a top-level better-auth option
    (NOT inside `emailAndPassword`); password reset (`sendResetPassword`) is
    inside `emailAndPassword`. Both use `src/lib/email.ts` (nodemailer/Resend).
    When SMTP isn't configured, `requireEmailVerification` is false and
    `sendEmail()` is a no-op (logs warning). This lets a user who signed up with
    email/password later sign in with Google (same email) and vice-versa, linking
    both providers to one account.
    Password reset: `POST /api/auth/request-password-reset` (client:
    `requestPasswordReset`) → email with reset link → `GET /api/auth/reset-password/:token`
    → frontend `/reset-password?token=...` → `POST /api/auth/reset-password`
    (client: `resetPassword`).
    Email verification: `POST /api/auth/send-verification-email` → email with
    verify link → `GET /api/auth/verify-email?token=...`. The frontend
    `AuthForm` shows a "check your email" notice after sign-up (when SMTP is
    configured) and offers a "Resend verification email" link when sign-in fails
    with "Email not verified". `sendVerificationEmail` is exported from
    `src/lib/auth-client.ts`.
  - `src/lib/openrouter.ts` — OpenRouter client: video (submit + poll) **and**
    image (`generateImage`, `listImageModels`) generation, plus video model list.
  - `src/lib/facefusion.ts` — calls the self-hosted FaceFusion swap service over HTTP.
    The frame face-swap step in `renderBlockClip` is provider-pluggable via
    `SWAP_PROVIDER`: `facefusion` (classic pixel swap) or `flux` (diffusion identity
    edit through an OpenRouter image model `OPENROUTER_SWAP_MODEL`, default
    `black-forest-labs/flux.2-klein-4b`, via `swapFaceWithImageModel`). The `flux`
    path also honors a per-block `swapContext` prompt. Verify a model with
    `scripts/test-flux-swap.ts`.
  - `src/lib/storage.ts` — MinIO (S3-compatible) object-store client. Includes
    `deleteObject`/`deleteObjects` for cleanup when DB records are deleted
    (avatars, templates, blocks, audio clips, account deletion).
  - `src/lib/uploads.ts` — shared multer instance + image helpers (`extFromMime`,
    `toDataUrl`); reused by every route that accepts uploads.
  - `src/lib/ffmpeg.ts` — shells out to **ffmpeg** to stitch template clips
    together (scale/pad to a common size) and mix any number of positioned audio
    parts over them (`AudioPart[]`: each trimmed + `adelay`ed to its start, summed
    with `amix`), to extract thumbnails, and to read an uploaded file's duration
    (`probeMediaDuration`, via **ffprobe**). ffmpeg is installed in the backend
    Docker image.
  - `src/lib/templateRender.ts` + `src/lib/runRender.ts` — synchronous template
    render pipeline. `renderBlockClip()` generates one block's clip (the block's
    chosen avatar slot is passed as the OpenRouter reference image and, when
    `faceSwapStart`/`faceSwapEnd` are set, is face-swapped onto the block's base
    start/end frame); `renderTemplate()` runs it for every block, stitches the clips,
    mixes the template's audio clips over them, and makes a thumbnail. The timeline
    has no fixed length — it runs to the furthest clip (video *or* audio), padding
    the video with black if audio extends past it. `renderBlockClip()` is also reused
    by the per-block "bake" route. Blocks reference avatars by slot — never per-block uploads.
    On **export** the cover thumbnail is **AI-generated from the block prompts**
    (`generateAiThumbnail` → OpenRouter image model `OPENROUTER_THUMBNAIL_MODEL`),
    falling back to an ffmpeg frame grab on error; user renders still use a frame grab.
  - `src/lib/templateSerialize.ts` — attaches public URLs to template/block/render rows.
  - `src/middleware/requireAdmin.ts` — gates admin routes; lazily promotes emails
    in `ADMIN_EMAILS` to the `admin` role. `resolveIsAdmin` is reused by `/api/me`.
  - `src/routes/{videos,images,faceswaps}.ts` — CRUD + generation per media type.
  - `src/routes/avatars.ts` — user avatars (1-2 photos; first photo = face source).
  - `src/routes/templates.ts` — user-facing templates (`/api/templates`) + their
    renders (`/api/template-renders`).
  - `src/routes/adminTemplates.ts` — admin CRUD for templates, blocks **and audio
    clips** (`/audio`, `/audio/:clipId`), plus `/blocks/:id/bake` (generate one
    block's preview clip) and `/export` (render + publish). `/api/admin/templates`,
    admin-only. Template create/patch no longer take an upfront audio file or
    duration — audio is added per-clip in the editor.
  - `src/routes/me.ts` — `/api/me` → `{ id, email, isAdmin, isSuperadmin, credits }`.
    Also `DELETE /api/me` for GDPR account deletion (cascades all user data + cleans
    MinIO objects).
  - `src/lib/email.ts` — nodemailer SMTP email sending (`sendEmail`, `isEmailConfigured`).
    Used by `auth.ts` for email verification (top-level `emailVerification` option)
    and password reset (`emailAndPassword.sendResetPassword`). Configured for Resend
    (`smtp.resend.com:465`). When SMTP isn't configured, calls are no-ops (logged
    warnings). `SMTP_FROM` accepts `"Name <email>"` format.
  - `src/routes/models.ts` — `/api/models[/video]` (video) and `/api/models/image`.
  - `src/routes/credits.ts` — credits & billing (`/api/credits`): balance + ledger
    (`GET /`), packs + per-action prices + checkout config (`GET /packs`), create a
    Dodo Payments checkout session (`POST /checkout`), confirm a completed payment
    + grant credits (`POST /confirm`), and a `payment.succeeded` webhook handler
    (`POST /webhook`, mounted with a raw-body parser BEFORE `express.json()` in
    `index.ts` so the Standard Webhooks HMAC-SHA256 signature can be verified
    against the exact bytes).
  - `src/lib/credits.ts` — credit ledger helpers + pricing. `actionCost()` returns
    the FIXED credit price per action (`CREDITS_PER_{IMAGE,VIDEO,TEMPLATE_RENDER}`
    env). `spendCredits()` is an atomic conditional decrement (can't go negative),
    `refundCredits()` is net-aware/idempotent (so a charge→refund→re-charge retry
    works and double callbacks don't double-refund), `addCredits()` grants
    PURCHASE/BONUS/REFUND/ADJUSTMENT. `CREDIT_PACKS` defines the 3 INR top-up tiers,
    each with a Dodo Payments `productId`.
  - `src/lib/dodopayments.ts` — minimal Dodo Payments REST client (no SDK dep):
    `createCheckoutSession` (hosted checkout redirect) and `verifyWebhookSignature`
    (Standard Webhooks HMAC-SHA256). **Note:** Dodo's `webhook-signature` header
    uses the format `v1,<base64>` (without the `sig=` prefix that the Standard
    Webhooks spec shows); the parser handles both formats.
- `infra/facefusion` — Dockerfile + `server.py`: a tiny FastAPI wrapper around
  FaceFusion's `headless-run` CLI (3.6.1 ships no REST API). Exposes
  `POST /swap` (multipart source+target → swapped image) + `GET /health`.
  `entrypoint.sh` pre-downloads the `lite` model set (`force-download
  --download-scope lite`) on first boot into the `facefusion_data` volume
  (`/facefusion/.assets`), gated by a marker file so restarts are instant. The swap
  runs a **max-likeness** config (env-tunable, see below): `hyperswap_1a_256` swapper
  + `1024x1024` pixel boost + box/occlusion mask + a tight `0.2` mask blur + lossless
  output, plus a `gfpgan_1.4` face-enhancer pass kept at a **low blend (30)** so it
  restores detail without averaging out the source person's features. Tune via env on
  the `facefusion` service: `FACE_SWAPPER_MODEL`, `FACE_SWAPPER_PIXEL_BOOST`,
  `FACE_ENHANCER_ENABLED` (set false for the strongest, roughest likeness),
  `FACE_ENHANCER_MODEL`, `FACE_ENHANCER_BLEND`, `FACE_MASK_BLUR`. (CPU
  execution.) The extra models that config needs beyond `lite` (hyperswap, GFPGAN,
  occluder) download lazily on the first swap, then cache in the volume — so only the
  first swap is slow. (`full` scope is avoided: it greedily pulls many unrelated heavy
  models and a single corrupt source aborts the whole pre-download.)
- `packages/db` — Prisma schema (`prisma/schema.prisma`) + client (`@repo/db`).
  Models: `Video`, `Image`, `FaceSwap` (shared `GenerationStatus` enum), plus the
  templates feature: `Avatar`, `Template`, `TemplateBlock`, `TemplateAudioClip`,
  `TemplateRender`, and a `role` field on `User` (`"user"`/`"admin"`). The credits
  feature adds a `credits` balance on `User`, the `CreditTransaction` ledger
  (`CreditTxnType`) and `Payment` rows (`PaymentStatus`) for Dodo Payments orders.
  Reused by the backend; never duplicate Prisma logic elsewhere.

## Conventions

- Package manager is **bun**. Use `bun install`, `bun run <script>`.
- Backend imports use `.js` extensions (NodeNext); bun resolves them to `.ts` at runtime.
- Frontend uses the `@/` alias for `src/`.
- Keep all Prisma access in the `@repo/db` package.
- All user-uploaded inputs and generated outputs (videos, images, face swaps) must
  be stored in the object store (MinIO) — see `src/lib/storage.ts`. Object keys are
  persisted on the `Video`/`Image`/`FaceSwap` models; the bucket is anonymous-read,
  so the API returns permanent public URLs (`getPublicUrl`) built from
  `MINIO_FRONTEND_ENDPOINT`.
- Generation is **synchronous**: routes create a DB row (`IN_PROGRESS`), call the
  provider, store the result and mark `COMPLETED`/`FAILED`. Mirror this pattern and
  reuse `src/lib/uploads.ts` when adding new media types. Template renders follow
  the same pattern (`TemplateRender` row → render → store), but a render generates
  *every* block sequentially, so it can take many minutes.
- **Template avatars**: the admin assigns 1-2 of their own avatars to a template at
  creation (`Template.avatarIds`, which sets `avatarSlots`). Blocks pick one of
  those slots (`TemplateBlock.avatarSlot`) for both the reference image and the
  face-swap source — admins never re-upload per-block reference images. Admin
  `/export` renders with the template's own avatars; users pick their own avatars
  (same slot count) when they render via `POST /api/templates/:id/render`.
- **Durations are per-model** (spec 09): OpenRouter exposes `supported_durations`
  per video model; the UI offers a fixed set (`ALLOWED_DURATIONS` in `lib/api.ts`)
  and filters the model picker to models that support the chosen duration. A
  block's `duration` is its generated length and equals its timeline footprint
  (`endSec = startSec + duration`, enforced server-side).
- **Multi-track timeline + overlaps**: blocks have a `track`; the timeline stacks
  tracks (higher = on top). Clips can be dragged left/right and between tracks, but
  a drag that would overlap another clip **on the same track** is rejected (it turns
  red and snaps back — `collides()` in `Timeline.tsx`); cross-track overlaps are
  allowed. Rendering (`buildTimelineSegments` in `templateRender.ts`) slices the
  timeline at block edges, picks the topmost covering block per slice (trimming via
  `ffmpeg.ts`'s `stitchTimeline`), and fills uncovered gaps with black.
- **Crop (trim)**: a block keeps its full generated clip (`duration`) but only uses
  `[cropStart, cropEnd)` — drag a clip's edges to crop/expand (Premiere-style). The
  footprint is `endSec - startSec = (cropEnd ?? duration) - cropStart` (enforced
  server-side); `buildTimelineSegments` offsets the clip in-point by `cropStart`.
- **Uploaded (non-AI) video blocks**: an admin can add a block backed by a raw
  uploaded video instead of an AI-generated clip — `TemplateBlock.sourceVideoKey`
  (created via the "Upload video" button on the editor; `POST …/blocks` with a
  `sourceVideo` multipart field, served by `videoUpload` in `uploads.ts`). The
  block's `duration` is the clip's real length (probed by `probeVideoDuration` in
  `ffmpeg.ts` via ffprobe), so it crops/moves like any clip. `prompt`/`model` are
  empty for these blocks and `renderBlockClip()`/baking are skipped — the render
  (`templateRender.ts`) uses `sourceVideoKey` verbatim, **always** (even on user
  renders where `forceRegenerate` is set), with no avatar/face-swap applied.
- **Face-swap provider**: `SWAP_PROVIDER` selects how a block's start/end frame is
  swapped in `renderBlockClip` — `facefusion` (default, pixel swap) or `flux`
  (diffusion identity edit via `OPENROUTER_SWAP_MODEL`, which accepts the block's
  `swapContext` prompt). The inspector exposes `swapContext` (shown only when a
  face-swap toggle is on); it's shared across a link group like other content.
- **Audio clips + auto length**: templates have no upfront duration or single
  audio track. The admin uploads any number of audio files as `TemplateAudioClip`s
  (the "Upload audio" button → `POST …/audio`); each is placed on an audio lane
  (`track`), can be dragged/cropped like a video block, and its `duration` is the
  uploaded file's real length (probed via ffprobe). All audio clips are **mixed**
  together over the video on render (overlaps on the same lane are rejected like
  video; cross-lane overlaps are allowed + summed). The timeline length is derived
  from the furthest clip (video or audio) everywhere — there is no `durationSec`.
- **Copy/paste with linked references**: blocks sharing a `linkGroupId` share
  generation content (prompt, model, frames, baked `videoKey`, …). The copy endpoint
  (`POST …/blocks/:id/copy`) clones content into a new linked block; editing or
  baking any member propagates content to the rest (PATCH/bake in `adminTemplates.ts`).
  Position + crop stay per-block. Frontend: ⌘/Ctrl+C / +V or the Copy/Paste buttons.
- **Admins** are determined by `role == "admin"` on `User`, seeded from the
  `ADMIN_EMAILS` allowlist. Gate admin-only routes with `requireAdmin`; the
  frontend reads `/api/me`.
- **Credits**: users buy credits (Dodo Payments, INR) on `/billing` and spend a FIXED
  number per generation — `actionCost()` in `src/lib/credits.ts`. Every billable
  route (`videos`, `images`, template `render`/`retry`) follows the same pattern:
  reject up front with **402** if the balance is too low, `spendCredits()` once the
  DB row exists, and `refundCredits()` on failure (synchronous routes in their
  catch; template renders in the background `.catch`). Admin `/export` and per-block
  `/bake` are NOT charged (they're authoring tools). The frontend shows the balance
  in the navbar (`useMe().credits`); call `refreshCredits()` after any spend/top-up
  so it updates immediately. Pricing defaults assume ~30% margin over typical
  OpenRouter cost — raise `CREDITS_PER_*` for pricier model mixes.
- Local host-based template rendering needs **ffmpeg on PATH** (it's installed in
  the backend Docker image, but install it locally — e.g. `brew install ffmpeg` —
  to run renders outside Docker).

## Common commands

```sh
bun install                 # install all workspace deps
bun run db:generate         # generate the Prisma client (run after schema changes)
bun run db:migrate          # apply Prisma migrations
bun run dev                 # run all apps with hot reload (turbo)
bun run build               # build everything
bun run check-types         # type-check the whole monorepo
bun run lint                # lint
```

Per app:

```sh
bun run --cwd apps/backend dev
bun run --cwd apps/frontend dev
```

## Local infrastructure

```sh
bun run infra:up            # Postgres + MinIO only (for host-based dev)
bun run docker:up           # full stack in Docker
bun run docker:facefusion   # build + start the FaceFusion swap service (~5GB, needed for face swap)
bun run docker:reset        # stop + wipe volumes (DESTRUCTIVE)
```

## Verification

Before considering a change complete:

1. `bun run check-types` (must pass).
2. `bun run build` (frontend `vite build` + backend `tsc --noEmit`).
3. For backend logic, smoke-test by booting `bun run --cwd apps/backend start`
   and hitting `http://localhost:4000/health`.

## Environment

Secrets (`OPENROUTER_API_KEY`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`,
`BETTER_AUTH_SECRET`, `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`,
`DODO_PRODUCT_IDS`) are configured via `.env`. See the `.env.example` files at
the repo root and in each app/package. Google sign-in is only enabled when the
Google client id/secret are present. Dodo Payments is in `test_mode` or
`live_mode` per `DODO_PAYMENTS_ENVIRONMENT`. Webhook endpoints must be HTTPS;
for local dev use a tunnel (e.g. `localtunnel`) and point the Dodo webhook
endpoint to `<tunnel-url>/api/credits/webhook`. `FACEFUSION_URL` points the
backend at the FaceFusion swap service (`http://localhost:7865` on host,
`http://facefusion:7865` in Docker).

## Email / DNS setup (Resend + Cloudflare)

Email sending uses **Resend** SMTP (`smtp.resend.com:465`, user `resend`,
password = Resend API key). The sender is `SMTP_FROM` in `apps/backend/.env`.

- While `devinedesk.com` is pending verification in Resend, use the Resend
  testing sender: `DevineDesk <onboarding@resend.dev>`. This only delivers to
  the Resend account owner's email.
- Once Resend verifies `devinedesk.com`, switch to:
  `DevineDesk <noreply@devinedesk.com>` — then any recipient is allowed.

Resend requires four DNS records for `devinedesk.com`:
1. `resend._domainkey` TXT (DKIM)
2. `send` MX → `feedback-smtp.ap-northeast-1.amazonses.com` priority 10
3. `send` TXT → `v=spf1 include:amazonses.com ~all`
4. `_dmarc` TXT → `v=DMARC1; p=none;`

**Wix** (the current registrar) does not allow editing NS records or adding
subdomain MX records. The domain has been added to **Cloudflare** and all
records (including the `send` MX) are configured there. Cloudflare assigned:
- `jasper.ns.cloudflare.com`
- `oaklyn.ns.cloudflare.com`

The nameserver change at Wix must be done by Wix Customer Care (live chat
requested). Once Wix updates the nameservers to Cloudflare, DNS propagates
(up to 48h), Resend verifies the domain, and `SMTP_FROM` can be switched to
the branded sender.

After verification, test: sign up with a non-owner email → confirm the
verification email arrives → click the link → sign in. Also test password
reset. Run `bun run check-types && bun run build && bun run lint` after any
config change.

## Production deployment checklist

### DNS (in progress)

- [ ] Wix Domains Advanced Team updates nameservers to Cloudflare
      (escalation ticket **3000090102**, confirmed by Wix agent Isabela on 2026-08-19;
      she added a priority note to the case)
- [ ] Cloudflare zone status → Active
- [ ] Resend verifies `devinedesk.com`
- [ ] Switch `SMTP_FROM` to `DevineDesk <noreply@devinedesk.com>`
- [ ] Add A records for `app.devinedesk.com` and `api.devinedesk.com`
      pointing to the production server IP

### Server provisioning

- [ ] Provision a VPS (e.g. DigitalOcean droplet, Hetzner, AWS EC2)
- [ ] Install Docker + Docker Compose
- [ ] Clone the repo and copy `.env.example` → `.env`
- [ ] Fill in all production secrets (see below)
- [ ] `docker compose up -d --build` (postgres + minio + backend + frontend)
- [ ] Optionally: `docker compose --profile facefusion up -d --build facefusion`

### Production secrets (root `.env`)

- [ ] `POSTGRES_PASSWORD` — strong random password (not "postgres")
- [ ] `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
      (add `https://api.devinedesk.com/api/auth/callback/google` as redirect URI)
- [ ] `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_USER=resend`,
      `SMTP_PASS=<resend-api-key>`, `SMTP_FROM=DevineDesk <noreply@devinedesk.com>`
- [ ] `ADMIN_EMAILS=support@devinedesk.com`
- [ ] `OPENROUTER_API_KEY` — funded OpenRouter key
- [ ] `DODO_PAYMENTS_API_KEY` / `DODO_PAYMENTS_WEBHOOK_KEY` — live mode keys
- [ ] `DODO_PAYMENTS_ENVIRONMENT=live_mode`
- [ ] `DODO_PRODUCT_IDS` — live product IDs (separate from test IDs)
- [ ] `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` — strong credentials
- [ ] `BACKEND_URL=https://api.devinedesk.com`
- [ ] `FRONTEND_URL=https://app.devinedesk.com,https://devinedesk.com`
- [ ] `MINIO_FRONTEND_ENDPOINT=<public-endpoint>` (for object URLs)

### Object storage (production)

- [ ] Use a managed S3-compatible store (DigitalOcean Spaces, AWS S3, or
      self-hosted MinIO with a public endpoint)
- [ ] Set `MINIO_ENDPOINT`, `MINIO_FRONTEND_ENDPOINT`, `MINIO_PORT`,
      `MINIO_USE_SSL=true`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
- [ ] Ensure the bucket is publicly readable for object URLs to work

### HTTPS / TLS

- [ ] Put Cloudflare proxy in front (orange-cloud) for free TLS
- [ ] Or use Caddy/nginx + Let's Encrypt on the server
- [ ] Backend cookies use `SameSite=None; Secure` automatically when
      `BACKEND_URL` starts with `https://` (see `auth.ts`)

### CI/CD (GitHub Actions → ghcr.io)

- [x] Workflow uses GitHub Container Registry (ghcr.io) — no external secrets needed
- [ ] Ensure repo Settings → Actions → General → Workflow permissions = "Read and write"
- [ ] Push to `main` triggers build + push to ghcr.io
- [ ] On the server: `docker compose pull && docker compose up -d`

### Dodo Payments (live mode)

- [ ] Complete Dodo business verification
- [ ] Create live products (₹499, ₹1999, ₹4999)
- [ ] Set webhook endpoint to `https://api.devinedesk.com/api/credits/webhook`
- [ ] Switch `DODO_PAYMENTS_ENVIRONMENT=live_mode`

### Post-deploy verification

- [ ] `curl https://api.devinedesk.com/health` → `{"status":"ok"}`
- [ ] Sign up with a real email → verify → sign in
- [ ] Test Google OAuth sign-in
- [ ] Test password reset
- [ ] Test credit purchase (live Dodo checkout)
- [ ] Test video/image generation
- [ ] Test face swap (if FaceFusion is deployed)
- [ ] Test template creation + render (admin + user)
