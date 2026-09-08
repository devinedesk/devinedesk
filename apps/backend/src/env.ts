import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  // Public URL the backend is reachable at (used for auth callbacks).
  BACKEND_URL: z.string().url().default("http://localhost:4000"),
  // Frontend origin(s), used for CORS + auth trusted origins. Accepts a
  // comma-separated list so the app can be served from multiple domains
  // (e.g. "https://devinedesk.com,https://app.devinedesk.com").
  FRONTEND_URL: z
    .string()
    .default("http://localhost:5173")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().url()).min(1)),

  DATABASE_URL: z.string().url(),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // SMTP for email verification (optional). When all four are set,
  // email/password users must verify their email before signing in.
  // Without these, email verification is skipped (dev mode).
  // Empty strings are treated as "not set" so .env files with blank values work.
  SMTP_HOST: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  SMTP_PASS: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  SMTP_FROM: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z
      .string()
      .refine(
        (v) => z.string().email().safeParse(v.replace(/^.*<(.+)>$/, "$1").trim()).success,
        "Invalid email or 'Name <email>' format",
      )
      .optional(),
  ),

  // Comma-separated list of emails that should be treated as admins. Users with
  // a matching email are promoted to the "admin" role on their next request.
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),

  // Comma-separated list of superadmin emails. Superadmins are admins who can
  // additionally see and manage EVERY admin's templates (not just their own).
  SUPERADMIN_EMAILS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),

  // ---- AI provider selection ----
  // Which AI provider to use for video/image generation:
  //  - "openrouter": OpenRouter (default, 400+ models, 5.5% platform fee)
  //  - "atlascloud": Atlas Cloud (400+ models, OSS sponsorship credits available)
  //  - "fal":        fal.ai (1,000+ models, Builder Grant $25–$250 / Startup
  //                  Program $1,000–$5,000 in free credits — see
  //                  https://fal.ai/startups)
  //  - "vertex":     Vertex AI (Google native: Veo video + Imagen image).
  //                  Covered by GCP $300 free trial credits + Google for
  //                  Startups Cloud Program. All costs bill through the GCP
  //                  billing account. (The Gemini API / Google AI Studio path
  //                  was removed — its costs are NOT covered by the $300
  //                  credits; it uses a separate prepayment billing system.)
  AI_PROVIDER: z.enum(["openrouter", "atlascloud", "fal", "vertex"]).default("openrouter"),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  // Image model used to AI-generate a template's cover thumbnail (from block prompts).
  OPENROUTER_THUMBNAIL_MODEL: z.string().default("google/gemini-3.1-flash-image"),
  // Fallback image models (comma-separated) tried in order if the primary
  // thumbnail model fails — provider/model outages (esp. Google) are common, so
  // we fall through to other reference-capable models before giving up.
  OPENROUTER_THUMBNAIL_FALLBACK_MODELS: z
    .string()
    .default("bytedance-seed/seedream-4.5,black-forest-labs/flux.2-klein-4b")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  // Atlas Cloud (alternative AI provider — OSS sponsorship credits available)
  ATLASCLOUD_API_KEY: z.string().optional(),

  // fal.ai (alternative AI provider — Builder Grant & Startup Program credits
  // available, see https://fal.ai/startups). 1,000+ image/video/audio models.
  FAL_API_KEY: z.string().optional(),

  // Vertex AI / Gemini Enterprise Agent Platform (Google native AI)
  // Required when AI_PROVIDER=vertex. When running on a GCP VM, the metadata
  // server provides auth automatically. For local dev, set VERTEX_ACCESS_TOKEN
  // from `gcloud auth print-access-token`.
  GCP_PROJECT_ID: z.string().optional(),
  // GCS bucket URI where Veo video outputs are stored (e.g. "gs://my-bucket/output/").
  VERTEX_GCS_OUTPUT_URI: z.string().optional(),
  // Static access token for local dev (from `gcloud auth print-access-token`).
  VERTEX_ACCESS_TOKEN: z.string().optional(),
  // Service account JSON key (for non-GCP environments). When set, JWT signing
  // is used — but for simplicity, prefer the metadata server or VERTEX_ACCESS_TOKEN.
  GCP_SERVICE_ACCOUNT_KEY: z.string().optional(),

  // NOTE: The Gemini API (Google AI Studio / generativelanguage.googleapis.com)
  // was removed because its costs are NOT covered by the GCP $300 free trial
  // credits — it uses a separate prepayment billing system. Vertex AI
  // (aiplatform.googleapis.com) provides equivalent Veo and Imagen models and
  // IS covered by the $300 free credits. Use AI_PROVIDER=vertex for Google
  // native AI generation.

  // Face-swap provider for template frames:
  //  - "facefusion": classic pixel-level swap via the self-hosted service (precise,
  //    supports per-person targeting, no prompt/context).
  //  - "flux": diffusion identity edit via an OpenRouter image model (higher quality,
  //    accepts a per-block `swapContext` prompt, regenerates the frame).
  SWAP_PROVIDER: z.enum(["facefusion", "flux"]).default("facefusion"),
  // Image model used for the "flux" swap provider (must accept reference images).
  OPENROUTER_SWAP_MODEL: z.string().default("black-forest-labs/flux.2-klein-4b"),

  // Self-hosted FaceFusion face-swap service.
  // Use "localhost" for host-based dev, "facefusion" inside docker-compose.
  FACEFUSION_URL: z.string().url().default("http://localhost:7865"),

  // Max template blocks generated concurrently during a single render. Blocks
  // each hit OpenRouter (video gen) and the CPU-bound FaceFusion swap service, so
  // an uncapped render of many blocks floods them and they time out. Keep this
  // low; set to 1 to fully serialize.
  RENDER_BLOCK_CONCURRENCY: z.coerce.number().int().positive().default(3),

  // How many times to attempt a block's video generation before giving up. The
  // provider occasionally returns a transient error or a content-filtered empty
  // result that succeeds on a retry. Total attempts = this value (>=1).
  RENDER_VIDEO_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),

  // Dodo Payments (credit purchases). Without these the billing endpoints
  // return a clear 503; everything else still works. Get keys from the Dodo
  // Payments dashboard (Developer → API and Developer → Webhooks).
  DODO_PAYMENTS_API_KEY: z.string().optional(),
  // Webhook signing secret (Dodo dashboard → Webhooks → endpoint Overview).
  // Used to verify `payment.succeeded` events (Standard Webhooks HMAC-SHA256).
  DODO_PAYMENTS_WEBHOOK_KEY: z.string().optional(),
  // "test_mode" or "live_mode" (determines the API base URL).
  DODO_PAYMENTS_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).default("test_mode"),
  // Dodo product IDs for each credit pack (created in the Dodo dashboard as
  // one-time payment products). Comma-separated in pack order: starter,pro,studio.
  DODO_PRODUCT_IDS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  // ---- Credit pricing (fixed price per action) ----
  // Each generation costs a flat number of credits regardless of model. Defaults
  // are tuned so that, even at the best-value pack's effective credit price,
  // revenue stays >= ~30% above the typical OpenRouter provider cost. If you
  // enable pricier models, raise these: pick credits >= providerCostUSD *
  // USD_INR_RATE * 1.72 (1 / 0.7 margin / 0.833 best-pack credit value).
  CREDITS_PER_IMAGE: z.coerce.number().int().positive().default(6),
  CREDITS_PER_VIDEO: z.coerce.number().int().positive().default(60),
  CREDITS_PER_TEMPLATE_RENDER: z.coerce.number().int().positive().default(1000),
  // USD→INR rate used only for documentation/estimates in the pricing helper.
  USD_INR_RATE: z.coerce.number().positive().default(86),

  // Redis (for BullMQ job queue). Optional — if not set, video generation
  // falls back to fire-and-forget (in-process promise). When set, jobs are
  // durable and survive container restarts.
  REDIS_URL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url().optional(),
  ),

  // MinIO / S3-compatible object store
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_FRONTEND_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET: z.string().default("devinedesk"),
  // When set, completely overrides the computed public URL base for object URLs.
  // Use this when the internal MinIO connection (MINIO_ENDPOINT/PORT/USE_SSL)
  // differs from how objects are publicly accessed (e.g. behind an nginx proxy).
  // Example: "https://devinedesk.com/minio" → URLs become
  //   https://devinedesk.com/minio/<bucket>/<key>
  MINIO_PUBLIC_BASE_URL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url().optional(),
  ),

  // ElevenLabs (text-to-speech / voice generation). Optional — key created at
  // https://elevenlabs.io/app/api/api-keys. Free tier with rate limits.
  // Not yet wired into a provider module; stored here so it's validated and
  // available for future voice-generation features.
  ELEVENLABS_API_KEY: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),

  // Sentry error tracking (optional). When set, backend errors are reported
  // to Sentry with stack traces.
  SENTRY_DSN: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
