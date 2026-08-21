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

/** Lazy-init the Redis connection + queue (only when REDIS_URL is set). */
async function getQueue() {
  if (!env.REDIS_URL) return null;
  if (_videoQueue) return _videoQueue as { add: (name: string, data: unknown, opts?: unknown) => Promise<unknown> };

  const { Queue } = await import("bullmq");
  const { Redis: IORedis } = await import("ioredis");

  _connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  _videoQueue = new Queue("video-generation", { connection: _connection as never });
  return _videoQueue as { add: (name: string, data: unknown, opts?: unknown) => Promise<unknown> };
}

/**
 * Enqueue a video generation job. Returns the job ID (string) or null if the
 * queue is unavailable (caller should fall back to fire-and-forget).
 */
export async function enqueueVideoJob(data: VideoJobData): Promise<string | null> {
  const queue = await getQueue();
  if (!queue) return null;
  const job = await queue.add("generate", data, {
    attempts: 2,
    backoff: { type: "exponential", delay: 10_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  });
  return (job as { id?: string }).id ?? null;
}

/**
 * Start the video worker process. Called once at server startup when
 * REDIS_URL is configured. The worker processes jobs by calling the provided
 * handler.
 */
export async function startVideoWorker(
  handler: (data: VideoJobData) => Promise<void>,
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

  (_videoWorker as { on: (event: string, cb: (...args: unknown[]) => void) => void }).on("completed", (job: unknown) => {
    console.log(`[queue] Video job completed: ${(job as { id?: string }).id}`);
  });
  (_videoWorker as { on: (event: string, cb: (...args: unknown[]) => void) => void }).on("failed", (job: unknown, err: unknown) => {
    console.error(`[queue] Video job failed: ${(job as { id?: string }).id}`, err);
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
