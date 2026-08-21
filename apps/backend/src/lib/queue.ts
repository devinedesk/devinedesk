/**
 * BullMQ-based durable job queue for background generation tasks.
 *
 * When REDIS_URL is configured, video (and template render) jobs are enqueued
 * and processed by a worker in the same process. Jobs survive container
 * restarts — on restart, the worker picks up any IN_PROGRESS rows that still
 * have pending jobs in the queue.
 *
 * When REDIS_URL is NOT set, the queue is unavailable and callers fall back to
 * fire-and-forget (in-process promise). This keeps dev mode zero-dependency.
 */
import { env } from "../env.js";

let _connection: unknown = null;
let _videoQueue: unknown = null;
let _videoWorker: unknown = null;

/** True when Redis is configured and the queue is available. */
export const queueAvailable = !!env.REDIS_URL;

interface BullQueueHandle {
  add: (name: string, data: unknown, opts?: unknown) => Promise<{ id?: string }>;
  getJob: (id: string) => Promise<{ getState: () => Promise<string> } | undefined>;
}

/** Lazy-init the Redis connection + queue (only when REDIS_URL is set). */
async function getQueue(): Promise<BullQueueHandle | null> {
  if (!env.REDIS_URL) return null;
  if (_videoQueue) return _videoQueue as BullQueueHandle;

  const { Queue } = await import("bullmq");
  const { Redis: IORedis } = await import("ioredis");

  _connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  _videoQueue = new Queue("video-generation", { connection: _connection as never });
  return _videoQueue as BullQueueHandle;
}

/**
 * Enqueue a video generation job. Returns the job ID (string) or null if the
 * queue is unavailable (caller should fall back to fire-and-forget).
 */
export async function enqueueVideoJob(data: VideoJobData): Promise<string | null> {
  const queue = await getQueue();
  if (!queue) return null;
  // jobId = videoId: dedupes accidental double-enqueues and lets the startup
  // reconciler look up a row's job by its video id.
  const job = await queue.add("generate", data, {
    jobId: data.videoId,
    attempts: 2,
    backoff: { type: "exponential", delay: 10_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  });
  return job.id ?? null;
}

/**
 * Return the BullMQ state of a video's job ("waiting", "active", "failed", …),
 * or null when the queue is unavailable or no such job exists (never enqueued,
 * or already pruned). Used by the startup reconciler.
 */
export async function getVideoJobState(videoId: string): Promise<string | null> {
  const queue = await getQueue();
  if (!queue) return null;
  const job = await queue.getJob(videoId);
  return job ? job.getState() : null;
}

/** Shape of a BullMQ job as delivered to the "failed" event handler. */
interface BullFailedJob {
  id?: string;
  data: VideoJobData;
  attemptsMade: number;
  opts?: { attempts?: number };
}

/**
 * Start the video worker process. Called once at server startup when
 * REDIS_URL is configured. The worker processes jobs by calling the provided
 * handler; `onFailed` is invoked once a job is truly dead (final attempt
 * exhausted or stalled out) so the caller can mark the DB row FAILED and
 * refund credits — without it, failed jobs would strand rows at IN_PROGRESS.
 */
export async function startVideoWorker(
  handler: (data: VideoJobData) => Promise<void>,
  onFailed?: (data: VideoJobData, error: unknown) => Promise<void>,
): Promise<void> {
  if (!env.REDIS_URL || _videoWorker) return;

  const { Worker } = await import("bullmq");
  const { Redis: IORedis } = await import("ioredis");

  const workerConnection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  _videoWorker = new Worker(
    "video-generation",
    async (job: { data: VideoJobData }) => {
      console.log(`[queue] Processing video job ${job.data.videoId}`);
      await handler(job.data);
    },
    { connection: workerConnection as never, concurrency: 2 },
  );

  const workerEvents = _videoWorker as { on: (event: string, cb: (...args: unknown[]) => void) => void };
  workerEvents.on("completed", (job: unknown) => {
    console.log(`[queue] Video job completed: ${(job as { id?: string }).id}`);
  });
  workerEvents.on("failed", (job: unknown, err: unknown) => {
    const failedJob = job as BullFailedJob | undefined;
    console.error(`[queue] Video job failed: ${failedJob?.id}`, err);
    if (!failedJob || !onFailed) return;
    // BullMQ fires "failed" after EVERY failed attempt — a retry may still
    // succeed, so only finalize once attempts are exhausted. Stall-outs
    // (process crash mid-generation) fail the job regardless of attempts left.
    const maxAttempts = failedJob.opts?.attempts ?? 1;
    const stalledOut = err instanceof Error && err.message.includes("stalled");
    if (failedJob.attemptsMade < maxAttempts && !stalledOut) return;
    onFailed(failedJob.data, err).catch((e) =>
      console.error(`[queue] Failed to finalize video job ${failedJob.id}:`, e),
    );
  });

  console.log("[queue] Video worker started (Redis-backed durable queue)");
}

/** Video generation job payload. */
export interface VideoJobData {
  videoId: string;
  userId: string;
  prompt: string;
  model: string;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  generateAudio?: boolean;
  startFrameKey?: string;
  endFrameKey?: string;
  referenceFrameKeys: string[];
  cost: number;
}
