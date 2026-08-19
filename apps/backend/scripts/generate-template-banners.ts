/**
 * Generate the 2 landing-page featured template banner videos on OpenRouter
 * and write them to apps/frontend/public/showcase/templates/.
 *
 *   bun run --cwd apps/backend scripts/generate-template-banners.ts
 *
 * Targets DevineDesk's top-2 customer types:
 *   1. creators-viral    — social media creators / influencers ("GO VIRAL")
 *   2. fans-blockbuster  — fans who want to star in famous scenes ("HERO ENTRY")
 *
 * Spends real money (~$1). Skips clips whose MP4 already exists — delete the
 * file to regenerate.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const API_KEY = process.env.OPENROUTER_API_KEY;
const BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
if (!API_KEY) {
  console.error("OPENROUTER_API_KEY is not set (load it from apps/backend/.env).");
  process.exit(1);
}

const OUT_DIR = path.resolve(process.cwd(), "../frontend/public/showcase/templates");
const DURATION = 4;
const RESOLUTION = "720p";
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_MS = 10 * 60 * 1000;

interface BannerClip {
  slug: string;
  prompt: string;
  model: string;
  modelLabel: string;
  aspectRatio: string;
}

const CLIPS: BannerClip[] = [
  {
    // Banner 1 — social media creators & influencers.
    slug: "creators-viral",
    prompt:
      "A live stadium jumbotron broadcast moment — the crowd cam finds one confident young person in the stands, they own the moment with a smooth pose and smile as the crowd erupts and confetti falls, broadcast graphics overlay, telephoto broadcast look, high energy.",
    model: "bytedance/seedance-2.0-fast",
    modelLabel: "seedance-2.0-fast",
    aspectRatio: "16:9",
  },
  {
    // Banner 2 — fans who want to star in famous scenes.
    slug: "fans-blockbuster",
    prompt:
      "Cinematic blockbuster hero entrance — a lone figure in a long dark coat walks toward the camera out of a wall of smoke and glowing embers in slow-motion, coat billowing, anamorphic lens flares, dramatic rim lighting, hyper-real feature-film look.",
    model: "bytedance/seedance-2.0-fast",
    modelLabel: "seedance-2.0-fast",
    aspectRatio: "16:9",
  },
];

const authHeaders = () => ({
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
});
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface JobResponse {
  id: string;
  polling_url?: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled" | "expired";
  unsigned_urls?: string[];
  usage?: { cost?: number };
  error?: string;
}

async function generate(clip: BannerClip): Promise<number | undefined> {
  const file = `${clip.slug}.mp4`;
  const outPath = path.join(OUT_DIR, file);
  if (existsSync(outPath)) {
    console.log(`  [${clip.slug}] already exists — skipping`);
    return undefined;
  }

  const submitRes = await fetch(`${BASE_URL}/videos`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model: clip.model,
      prompt: clip.prompt,
      duration: DURATION,
      resolution: RESOLUTION,
      aspect_ratio: clip.aspectRatio,
    }),
  });
  if (!submitRes.ok) {
    throw new Error(`submit failed: ${submitRes.status} ${await submitRes.text()}`);
  }
  let status = (await submitRes.json()) as JobResponse;
  const jobId = status.id;
  const pollingUrl = status.polling_url ?? `${BASE_URL}/videos/${jobId}`;
  console.log(`  [${clip.slug}] submitted (${clip.model}) job=${jobId}`);

  const deadline = Date.now() + MAX_POLL_MS;
  while (status.status === "pending" || status.status === "in_progress") {
    if (Date.now() > deadline) throw new Error(`timed out (job ${jobId})`);
    await sleep(POLL_INTERVAL_MS);
    const pollRes = await fetch(pollingUrl, { headers: authHeaders() });
    if (!pollRes.ok) throw new Error(`poll failed: ${pollRes.status} ${await pollRes.text()}`);
    status = (await pollRes.json()) as JobResponse;
  }
  if (status.status !== "completed") {
    throw new Error(status.error ?? `generation ${status.status} (job ${jobId})`);
  }

  const contentUrl = status.unsigned_urls?.[0] ?? `${BASE_URL}/videos/${jobId}/content?index=0`;
  const videoRes = await fetch(contentUrl, { headers: authHeaders() });
  if (!videoRes.ok) throw new Error(`download failed: ${videoRes.status}`);
  const buffer = Buffer.from(await videoRes.arrayBuffer());

  await writeFile(outPath, buffer);
  const cost = status.usage?.cost;
  console.log(
    `  [${clip.slug}] done -> templates/${file} (${(buffer.length / 1e6).toFixed(1)}MB${cost != null ? `, $${cost.toFixed(4)}` : ""})`,
  );
  return cost;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Generating ${CLIPS.length} template banner clip(s) (${DURATION}s, ${RESOLUTION}) -> ${OUT_DIR}\n`);

  let total = 0;
  for (const clip of CLIPS) {
    try {
      const cost = await generate(clip);
      if (cost != null) total += cost;
    } catch (err) {
      console.error(`  [${clip.slug}] FAILED: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`\nTotal new spend: $${total.toFixed(4)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
