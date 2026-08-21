import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { prisma } from "@repo/db";
import { env } from "./env.js";
import { auth } from "./auth.js";
import { ensureBucket } from "./lib/storage.js";
import { videosRouter, failVideoById } from "./routes/videos.js";
import { imagesRouter } from "./routes/images.js";
import { faceSwapsRouter } from "./routes/faceswaps.js";
import { modelsRouter } from "./routes/models.js";
import { meRouter } from "./routes/me.js";
import { avatarsRouter } from "./routes/avatars.js";
import { templatesRouter, templateRendersRouter } from "./routes/templates.js";
import { adminTemplatesRouter } from "./routes/adminTemplates.js";
import { creditsRouter, creditsWebhookHandler } from "./routes/credits.js";
import { mediaRouter } from "./routes/media.js";
import { uploadErrorHandler } from "./lib/uploads.js";
import { queueAvailable, getVideoJobState } from "./lib/queue.js";
import { rateLimit } from "./middleware/rateLimit.js";

// Initialize Sentry as early as possible so it captures startup errors.
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Performance monitoring — 10% of transactions are sampled.
    tracesSampleRate: 0.1,
  });
}

const app = express();

app.use(
  cors({
    // env.FRONTEND_URL is a list of allowed origins (multiple domains).
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// Better-auth handler must be mounted BEFORE express.json().
// Rate-limited to prevent brute-force sign-in / sign-up attacks.
app.all(
  "/api/auth/*",
  rateLimit({ windowMs: 60_000, max: 30, message: "Too many auth requests. Please slow down." }),
  toNodeHandler(auth),
);

// The Dodo Payments webhook must verify the signature against the raw request
// bytes, so it needs the raw body and must be mounted BEFORE express.json().
app.post(
  "/api/credits/webhook",
  express.raw({ type: "*/*" }),
  creditsWebhookHandler,
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    queue: process.env.REDIS_URL ? "redis" : "fire-and-forget",
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check for monitoring tools (UptimeRobot, Sentry, etc.)
// Returns 200 if all services are healthy, 503 if any are degraded.
app.get("/health/detailed", async (_req, res) => {
  const checks: Record<string, string> = {};
  let allOk = true;

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
    allOk = false;
  }

  // MinIO
  try {
    await import("./lib/storage.js").then((m) => m.ensureBucket());
    checks.minio = "ok";
  } catch {
    checks.minio = "error";
    allOk = false;
  }

  // Redis (if configured)
  if (process.env.REDIS_URL) {
    try {
      const { Redis } = await import("ioredis");
      const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
      await redis.ping();
      redis.disconnect();
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
      allOk = false;
    }
  } else {
    checks.redis = "not_configured";
  }

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/videos", videosRouter);
app.use("/api/images", imagesRouter);
app.use("/api/faceswaps", faceSwapsRouter);
app.use("/api/models", modelsRouter);
app.use("/api/me", meRouter);
app.use("/api/avatars", avatarsRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/template-renders", templateRendersRouter);
app.use("/api/admin/templates", adminTemplatesRouter);
app.use("/api/credits", creditsRouter);
app.use("/api/media", mediaRouter);

// Turn multer upload failures into clean 400s (mounted after all routers).
app.use(uploadErrorHandler);

// Sentry error handler must be after all controllers (last middleware).
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

/**
 * Template renders run in this process (a detached background task), so any
 * restart/crash/redeploy orphans an in-flight render — it can never resume and
 * would otherwise sit at IN_PROGRESS forever. On boot, mark any such renders (and
 * their non-terminal blocks) FAILED so they surface a clear error + Retry option.
 */
async function failOrphanedRenders() {
  try {
    const orphaned = await prisma.templateRender.findMany({
      where: { status: "IN_PROGRESS" },
      select: { id: true },
    });
    if (orphaned.length === 0) return;
    const ids = orphaned.map((r) => r.id);
    await prisma.templateRender.updateMany({
      where: { id: { in: ids } },
      data: { status: "FAILED", error: "Render was interrupted by a server restart. Please try again." },
    });
    await prisma.templateRenderBlock.updateMany({
      where: {
        renderId: { in: ids },
        phase: { in: ["QUEUED", "FACE_SWAP", "VIDEO_GENERATION", "RETRYING", "STITCHING"] },
      },
      data: { phase: "FAILED", error: "Interrupted by server restart" },
    });
    console.log(`↺ Marked ${ids.length} interrupted render(s) as failed on startup.`);
  } catch (err) {
    console.error("⚠️  Could not reconcile interrupted renders:", err instanceof Error ? err.message : err);
  }
}

/** BullMQ states where the queue will still drive the job to completion. */
const LIVE_JOB_STATES = new Set(["waiting", "active", "delayed", "prioritized", "waiting-children", "paused"]);

/**
 * A video still IN_PROGRESS at boot was interrupted by a restart/crash/redeploy.
 * Without Redis, in-flight generation died with the process, so EVERY such row
 * is orphaned. With Redis, BullMQ resumes jobs still present in the queue, so
 * only rows whose job is GONE (never enqueued, attempts exhausted, or pruned)
 * are orphaned. Orphans are marked FAILED + refunded so they surface a clear
 * error instead of showing "Processing…" forever.
 */
async function failOrphanedVideos() {
  try {
    const inProgress = await prisma.video.findMany({
      where: { status: "IN_PROGRESS" },
      select: { id: true, userId: true },
    });
    if (inProgress.length === 0) return;
    let failedCount = 0;
    for (const video of inProgress) {
      if (queueAvailable) {
        const state = await getVideoJobState(video.id);
        if (state && LIVE_JOB_STATES.has(state)) continue; // BullMQ will resume it
      }
      await failVideoById(
        video.id,
        video.userId,
        "Generation was interrupted by a server restart. Please try again.",
      );
      failedCount++;
    }
    if (failedCount > 0) {
      console.log(`↺ Marked ${failedCount} interrupted video(s) as failed on startup.`);
    }
  } catch (err) {
    console.error("⚠️  Could not reconcile interrupted videos:", err instanceof Error ? err.message : err);
  }
}

async function start() {
  await ensureBucket().catch((err) => {
    console.error("⚠️  Could not ensure object-store bucket exists:", err.message);
  });
  await failOrphanedRenders();
  await failOrphanedVideos();
  app.listen(env.PORT, () => {
    console.log(`🚀 Backend listening on ${env.BACKEND_URL} (port ${env.PORT}) Started`);
  });
}

start();
