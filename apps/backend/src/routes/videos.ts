import { Router } from "express";
import { z } from "zod";
import { prisma, type Video } from "@repo/db";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";
import { generateVideo } from "../lib/openrouter.js";
import { getPublicUrl, uploadBuffer, downloadObject } from "../lib/storage.js";
import { extFromMime, toDataUrl, upload } from "../lib/uploads.js";
import { actionCost, getBalance, refundCredits, spendCredits } from "../lib/credits.js";
import { enqueueVideoJob, startVideoWorker, queueAvailable, type VideoJobData } from "../lib/queue.js";

export const videosRouter: Router = Router();

const createSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().min(1, "Model is required"),
  duration: z.coerce.number().int().positive().optional(),
  resolution: z.string().optional(),
  aspectRatio: z.string().optional(),
  generateAudio: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

type UploadedFiles = Record<string, Express.Multer.File[] | undefined>;

/** Serialize a Video row, attaching public URLs for stored objects. */
function serializeVideo(video: Video) {
  return {
    ...video,
    videoUrl: video.videoKey ? getPublicUrl(video.videoKey) : null,
    startFrameUrl: video.startFrameKey ? getPublicUrl(video.startFrameKey) : null,
    endFrameUrl: video.endFrameKey ? getPublicUrl(video.endFrameKey) : null,
    referenceFrameUrls: video.referenceFrameKeys.map(getPublicUrl),
  };
}

/**
 * Process a video generation job. This is the single source of truth for
 * background video generation — called by both the BullMQ worker (when Redis
 * is available) and the fire-and-forget fallback.
 */
export async function processVideoJob(data: VideoJobData): Promise<void> {
  // Download input frames from MinIO (they were uploaded before enqueuing).
  const startFrameBuffer = data.startFrameKey ? await downloadObject(data.startFrameKey) : undefined;
  const endFrameBuffer = data.endFrameKey ? await downloadObject(data.endFrameKey) : undefined;
  const referenceFrameBuffers = await Promise.all(
    data.referenceFrameKeys.map((k) => downloadObject(k)),
  );

  const generated = await generateVideo({
    model: data.model,
    prompt: data.prompt,
    duration: data.duration,
    resolution: data.resolution,
    aspectRatio: data.aspectRatio,
    generateAudio: data.generateAudio,
    firstFrame: startFrameBuffer
      ? { url: `data:image/jpeg;base64,${startFrameBuffer.toString("base64")}` }
      : undefined,
    lastFrame: endFrameBuffer
      ? { url: `data:image/jpeg;base64,${endFrameBuffer.toString("base64")}` }
      : undefined,
    references: referenceFrameBuffers.map((buf) => ({
      url: `data:image/jpeg;base64,${buf.toString("base64")}`,
    })),
  });

  const videoKey = await uploadBuffer(generated.buffer, generated.contentType, "videos", "mp4");
  await prisma.video.update({
    where: { id: data.videoId },
    data: {
      status: "COMPLETED",
      videoKey,
      providerJobId: generated.providerJobId,
      cost: generated.cost,
    },
  });
}

/**
 * Handle a video generation failure — refund credits and mark the row failed.
 * Called by both the queue worker's failed handler and the fire-and-forget catch.
 */
export async function failVideoJob(data: VideoJobData, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : "Video generation failed";
  console.error(`Video generation failed for ${data.videoId}:`, message);
  await refundCredits(data.userId, data.cost, {
    referenceType: "video",
    referenceId: data.videoId,
    description: "Refund: video generation failed",
  });
  await prisma.video.update({
    where: { id: data.videoId },
    data: { status: "FAILED", error: message },
  });
}

// List the current user's videos.
videosRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const videos = await prisma.video.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(videos.map(serializeVideo));
});

// Fetch a single video owned by the current user.
videosRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const video = await prisma.video.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!video) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeVideo(video));
});

// Create a video: upload inputs, enqueue generation, return IN_PROGRESS immediately.
videosRouter.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "startFrame", maxCount: 1 },
    { name: "endFrame", maxCount: 1 },
    { name: "referenceFrames", maxCount: 8 },
  ]),
  async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { prompt, model, duration, resolution, aspectRatio, generateAudio } = parsed.data;

    // Credits: fixed price per video. Reject up front if the user can't afford it
    // (avoids wasting input uploads), then charge once the row exists.
    const cost = actionCost("video");
    if ((await getBalance(req.userId!)) < cost) {
      res.status(402).json({ error: `Not enough credits. This video costs ${cost} credits.` });
      return;
    }

    const files = (req.files ?? {}) as UploadedFiles;
    const startFrame = files.startFrame?.[0];
    const endFrame = files.endFrame?.[0];
    const referenceFrames = files.referenceFrames ?? [];

    // 1. Persist uploaded input images to the object store.
    const [startFrameKey, endFrameKey, referenceFrameKeys] = await Promise.all([
      startFrame
        ? uploadBuffer(startFrame.buffer, startFrame.mimetype, "inputs", extFromMime(startFrame.mimetype))
        : Promise.resolve<string | undefined>(undefined),
      endFrame
        ? uploadBuffer(endFrame.buffer, endFrame.mimetype, "inputs", extFromMime(endFrame.mimetype))
        : Promise.resolve<string | undefined>(undefined),
      Promise.all(
        referenceFrames.map((f) => uploadBuffer(f.buffer, f.mimetype, "inputs", extFromMime(f.mimetype))),
      ),
    ]);

    // 2. Create the DB record up front.
    const video = await prisma.video.create({
      data: {
        userId: req.userId!,
        prompt,
        model,
        duration,
        resolution,
        aspectRatio,
        generateAudio,
        startFrameKey,
        endFrameKey,
        referenceFrameKeys,
        status: "IN_PROGRESS",
      },
    });

    // 2b. Charge credits now that we have a row to reference. A race could make
    // this fail even after the up-front check; if so, mark the row failed + 402.
    try {
      await spendCredits(req.userId!, cost, {
        referenceType: "video",
        referenceId: video.id,
        description: "Video generation",
      });
    } catch {
      await prisma.video.update({
        where: { id: video.id },
        data: { status: "FAILED", error: "Not enough credits." },
      });
      res.status(402).json({ error: `Not enough credits. This video costs ${cost} credits.` });
      return;
    }

    // 3. Return the IN_PROGRESS row immediately — generation runs in the
    //    background so the HTTP response doesn't hit proxy timeouts (e.g.
    //    Cloudflare's 100s limit). The frontend polls GET /api/videos/:id.
    res.status(202).json(serializeVideo(video));

    // 4. Enqueue the generation job. When Redis is available, the job is durable
    //    (survives container restarts). Otherwise, fall back to fire-and-forget.
    const jobData: VideoJobData = {
      videoId: video.id,
      userId: req.userId!,
      prompt,
      model,
      duration,
      resolution,
      aspectRatio,
      generateAudio,
      startFrameKey,
      endFrameKey,
      referenceFrameKeys,
      cost,
    };

    if (queueAvailable) {
      const jobId = await enqueueVideoJob(jobData);
      if (jobId) {
        console.log(`[queue] Enqueued video job ${jobId} for video ${video.id}`);
        return;
      }
    }

    // Fire-and-forget fallback (no Redis).
    processVideoJob(jobData).catch((err) => failVideoJob(jobData, err));
  },
);

// Start the video worker at module load (only when Redis is configured).
// The worker runs in the same process and processes jobs concurrently.
startVideoWorker(async (data) => {
  await processVideoJob(data);
}).catch((err) => {
  console.error("[queue] Failed to start video worker:", err instanceof Error ? err.message : err);
});
