import { env } from "../env.js";
import type {
  VideoModel,
  GenerateVideoParams,
  GeneratedVideo,
  GenerateImageParams,
  GeneratedImage,
  SwapFaceParams,
} from "./openrouter.js";

/**
 * Atlas Cloud provider — OpenAI-compatible API aggregating 400+ AI models
 * (video, image, LLM, audio, 3D) behind a single key.
 *
 * Used as a provider option alongside OpenRouter and Vertex AI. Selected via
 * `AI_PROVIDER=atlascloud`. Particularly cost-effective when combined with
 * the Atlas Cloud Open Source Sponsorship Program (free monthly credits for
 * active open-source projects — see https://www.atlascloud.ai/oss-program).
 *
 * API reference:
 *   - Media Generation: https://api.atlascloud.ai/api/v1
 *   - LLM (OpenAI-compat): https://api.atlascloud.ai/v1
 *   - Video: POST /api/v1/model/generateVideo → poll GET /api/v1/model/prediction/{id}
 *   - Image: POST /api/v1/model/generateImage → poll GET /api/v1/model/prediction/{id}
 *
 * Image and video generation are asynchronous: submit → get prediction_id →
 * poll until status is "completed"/"succeeded" → download from outputs URL.
 *
 * Every model exposes its input contract as a JSON schema (the `schema` URL in
 * the catalog). Param names are NOT uniform across models — e.g. first frame is
 * `image` on MiniMax but `start_image_url` on FLUX, references are `refers`
 * (array of {url,type}) on MiniMax but `reference_images` on Seedance — so both
 * model listing and generation map our generic params onto whatever each
 * model's schema actually declares.
 */

const MEDIA_BASE = "https://api.atlascloud.ai/api/v1";

function authHeaders(): Record<string, string> {
  if (!env.ATLASCLOUD_API_KEY) {
    throw new Error(
      "ATLASCLOUD_API_KEY is not configured. Set it in the backend .env to use Atlas Cloud.",
    );
  }
  return {
    Authorization: `Bearer ${env.ATLASCLOUD_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Model catalog + per-model input schemas
// ---------------------------------------------------------------------------

interface AtlasModel {
  uuid?: string;
  /** The model id, e.g. "minimax/h3-max/text-to-video". */
  model: string;
  /** "Video" | "Image" | "Text" | "Audio" — capitalized. */
  type?: string;
  displayName?: string;
  /** Long-form description. */
  profile?: string;
  /** URL of the model's JSON schema (components.schemas.Input.properties). */
  schema?: string;
  categories?: string[];
  tags?: string[];
}

interface SchemaProp {
  type?: string;
  enum?: unknown[];
  description?: string;
  items?: { properties?: Record<string, SchemaProp> };
  required?: string[];
}

interface ModelSchema {
  /** Input property map for the model (empty if unavailable). */
  props: Record<string, SchemaProp>;
  /** Required input fields, e.g. ["model","prompt","image"]. */
  required: string[];
}

const CATALOG_TTL_MS = 10 * 60 * 1000;
const SCHEMA_TTL_MS = 60 * 60 * 1000;

let catalogCache: { at: number; models: AtlasModel[] } | null = null;
const schemaCache = new Map<string, { at: number; schema: ModelSchema }>();

/** Fetch the full model catalog (cached — it's ~750KB and rarely changes). */
async function getCatalog(): Promise<AtlasModel[]> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
    return catalogCache.models;
  }
  const res = await fetch(`${MEDIA_BASE}/models`, {
    headers: env.ATLASCLOUD_API_KEY ? authHeaders() : { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to list Atlas Cloud models: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: AtlasModel[] };
  const models = json.data ?? [];
  catalogCache = { at: Date.now(), models };
  return models;
}

/** Fetch + cache a model's input schema (small static JSON on Atlas's CDN). */
async function getModelSchema(modelId: string): Promise<ModelSchema> {
  const cached = schemaCache.get(modelId);
  if (cached && Date.now() - cached.at < SCHEMA_TTL_MS) return cached.schema;

  let schema: ModelSchema = { props: {}, required: [] };
  const entry = (await getCatalog()).find((m) => m.model === modelId);
  if (entry?.schema) {
    try {
      const res = await fetch(entry.schema);
      if (res.ok) {
        const json = (await res.json()) as {
          components?: { schemas?: { Input?: { properties?: Record<string, SchemaProp>; required?: string[] } } };
        };
        const input = json.components?.schemas?.Input;
        schema = { props: input?.properties ?? {}, required: input?.required ?? [] };
      }
    } catch {
      // Schema fetch failed — fall through with empty props; generation will
      // send only the generic params and let the API validate.
    }
  }
  schemaCache.set(modelId, { at: Date.now(), schema });
  return schema;
}

/** Run an async mapping with bounded concurrency (schema fan-out). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]!);
    }
  });
  await Promise.all(workers);
  return out;
}

// ---------------------------------------------------------------------------
// Capability extraction (schema → the VideoModel fields the frontend uses)
// ---------------------------------------------------------------------------

const strEnum = (p?: SchemaProp): string[] | undefined => {
  const vals = p?.enum?.filter((v): v is string => typeof v === "string");
  return vals?.length ? vals : undefined;
};

const numEnum = (p?: SchemaProp): number[] | undefined => {
  const vals = p?.enum?.filter((v): v is number => typeof v === "number" && v > 0);
  return vals?.length ? vals : undefined;
};

/** True when a `refers`-style array accepts audio entries (lip-sync input). */
function refersAcceptsAudio(p?: SchemaProp): boolean {
  const t = p?.items?.properties?.["type"];
  return Array.isArray(t?.enum) && t.enum.includes("audio");
}

/** Params the app can never supply — models requiring these are filtered out. */
const UNSUPPLIABLE_INPUT = /^(video|video_url|source_video|input_video|motion_video)$/i;

function videoCaps(schema: ModelSchema): Pick<
  VideoModel,
  | "supported_resolutions"
  | "supported_durations"
  | "supported_aspect_ratios"
  | "supportsReferences"
  | "supportsAudioInput"
> {
  const p = schema.props;
  return {
    supported_resolutions: strEnum(p["resolution"]) ?? strEnum(p["size"]),
    supported_durations: numEnum(p["duration"]),
    supported_aspect_ratios: strEnum(p["ratio"]) ?? strEnum(p["aspect_ratio"]),
    supportsReferences: !!(
      p["refers"] ||
      p["references"] ||
      p["reference_images"] ||
      p["input_references"]
    ),
    supportsAudioInput: !!(
      p["reference_audios"] ||
      p["audio_url"] ||
      p["audio_reference"] ||
      (p["audio"] && p["audio"].type === "string") ||
      refersAcceptsAudio(p["refers"])
    ),
  };
}

function imageCaps(schema: ModelSchema): Pick<
  VideoModel,
  "supported_resolutions" | "supported_aspect_ratios" | "supportsReferences"
> {
  const p = schema.props;
  return {
    supported_resolutions: strEnum(p["resolution"]) ?? strEnum(p["size"]),
    supported_aspect_ratios: strEnum(p["aspect_ratio"]) ?? strEnum(p["ratio"]),
    supportsReferences: !!(p["images"] || p["image"] || p["input_references"]),
  };
}

// ---------------------------------------------------------------------------
// Model listing
// ---------------------------------------------------------------------------

/** List video-generation models available on Atlas Cloud. */
export async function listVideoModels(): Promise<VideoModel[]> {
  const entries = (await getCatalog()).filter((m) => m.type === "Video");
  const enriched = await mapLimit<AtlasModel, VideoModel | undefined>(entries, 12, async (m) => {
    const schema = await getModelSchema(m.model);
    // Drop models that require an input the app can't supply (source video for
    // video-extend/video-edit/video-to-video/motion-transfer variants).
    if (schema.required.some((r) => UNSUPPLIABLE_INPUT.test(r))) return undefined;
    return {
      id: m.model,
      name: m.displayName ?? m.model,
      description: m.profile,
      ...videoCaps(schema),
    };
  });
  return enriched.filter((m): m is VideoModel => !!m);
}

/** List image-generation models available on Atlas Cloud. */
export async function listImageModels(): Promise<VideoModel[]> {
  const entries = (await getCatalog()).filter((m) => m.type === "Image");
  return mapLimit<AtlasModel, VideoModel>(entries, 12, async (m) => {
    const schema = await getModelSchema(m.model);
    return {
      id: m.model,
      name: m.displayName ?? m.model,
      description: m.profile,
      ...imageCaps(schema),
    };
  });
}

// ---------------------------------------------------------------------------
// Prediction polling
// ---------------------------------------------------------------------------

interface PredictionResponse {
  code?: number;
  data?: {
    id: string;
    status: "processing" | "completed" | "succeeded" | "failed";
    outputs?: string[];
    error?: string;
    usage?: { cost?: number };
  };
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 10 * 60 * 1000; // 10 minutes

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Poll the prediction endpoint until the job reaches a terminal state.
 * Returns the outputs (URLs) and optional cost.
 */
async function pollPrediction(predictionId: string): Promise<{
  outputs: string[];
  cost?: number;
}> {
  const deadline = Date.now() + MAX_POLL_MS;
  const pollUrl = `${MEDIA_BASE}/model/prediction/${predictionId}`;

  while (true) {
    if (Date.now() > deadline) {
      throw new Error(`Atlas Cloud prediction ${predictionId} timed out after ${MAX_POLL_MS / 1000}s`);
    }
    await sleep(POLL_INTERVAL_MS);
    const res = await fetch(pollUrl, { headers: authHeaders() });
    if (!res.ok) {
      throw new Error(`Atlas Cloud poll failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as PredictionResponse;
    const data = json.data;
    if (!data) {
      throw new Error(`Atlas Cloud poll returned no data for prediction ${predictionId}`);
    }
    if (data.status === "completed" || data.status === "succeeded") {
      if (!data.outputs || data.outputs.length === 0) {
        throw new Error(`Atlas Cloud prediction ${predictionId} completed with no outputs`);
      }
      return { outputs: data.outputs, cost: data.usage?.cost };
    }
    if (data.status === "failed") {
      throw new Error(data.error ?? `Atlas Cloud prediction ${predictionId} failed`);
    }
    // Still processing — keep polling.
  }
}

/** Download content from a URL and return the buffer + content type. */
async function downloadContent(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download Atlas Cloud output: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

// ---------------------------------------------------------------------------
// Schema-driven param mapping
// ---------------------------------------------------------------------------

/** First declared property name from `names`, or undefined. */
const declared = (props: Record<string, SchemaProp>, names: string[]): string | undefined =>
  names.find((n) => props[n] !== undefined);

/**
 * Set body[key] = value when the model's schema declares one of `names` and —
 * when the property has an enum — the value is an allowed choice. Returns the
 * key that was set (or undefined if the param was skipped).
 */
function setParam(
  body: Record<string, unknown>,
  props: Record<string, SchemaProp>,
  names: string[],
  value: unknown,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  const key = declared(props, names);
  if (!key) return undefined;
  const allowed = props[key]?.enum;
  if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(value)) {
    return undefined; // unsupported value → let the model's default apply
  }
  body[key] = value;
  return key;
}

/** Pick the "WxH" enum entry whose aspect ratio is closest to `ratio` ("16:9"). */
function sizeForAspectRatio(sizes: unknown[] | undefined, ratio: string): string | undefined {
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(ratio);
  if (!m || !sizes) return undefined;
  const target = Number(m[1]) / Number(m[2]);
  let best: string | undefined;
  let bestDiff = Infinity;
  for (const s of sizes) {
    if (typeof s !== "string") continue;
    const mm = /^(\d+)x(\d+)$/.exec(s);
    if (!mm) continue;
    const diff = Math.abs(Number(mm[1]) / Number(mm[2]) - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = s;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Video generation
// ---------------------------------------------------------------------------

interface AtlasVideoSubmitResponse {
  code?: number;
  data?: { id: string; status: string };
}

/** Generate a video via Atlas Cloud (async: submit → poll → download). */
export async function generateVideo(params: GenerateVideoParams): Promise<GeneratedVideo> {
  const schema = await getModelSchema(params.model);
  const props = schema.props;

  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
  };
  setParam(body, props, ["duration"], params.duration);
  setParam(body, props, ["resolution"], params.resolution);
  setParam(body, props, ["ratio", "aspect_ratio", "aspectRatio"], params.aspectRatio);
  setParam(body, props, ["audio", "generate_audio", "generateAudio"], params.generateAudio);

  // First/last frame inputs — the field name varies per model.
  const firstKey = declared(props, ["image", "start_image", "start_image_url", "first_frame", "firstFrame"]);
  const lastKey = declared(props, ["end_image", "end_image_url", "last_frame", "lastFrame"]);
  if (params.firstFrame && firstKey) body[firstKey] = params.firstFrame.url;
  if (params.lastFrame && lastKey) body[lastKey] = params.lastFrame.url;
  // Models that take both frames as an images[] array instead.
  if (props["images"] && !firstKey && (params.firstFrame || params.lastFrame)) {
    body["images"] = [params.firstFrame?.url, params.lastFrame?.url].filter(Boolean);
  }

  // Reference images — field name and item shape vary per model.
  const refs = params.references?.map((r) => r.url) ?? [];
  if (refs.length > 0) {
    if (props["refers"]) {
      body["refers"] = refs.map((url) => ({ url, type: "image" }));
    } else if (props["reference_images"]) {
      body["reference_images"] = refs;
    } else if (props["references"]) {
      body["references"] = refs;
    } else if (props["input_references"]) {
      body["input_references"] = refs;
    } else if (props["images"] && !body["images"]) {
      body["images"] = refs;
    }
  }

  // Lip-sync audio track (honored only by models that declare an audio input).
  if (params.audioReference) {
    if (props["reference_audios"]) {
      body["reference_audios"] = [params.audioReference.url];
    } else if (props["audio_url"]) {
      body["audio_url"] = params.audioReference.url;
    } else if (props["audio_reference"]) {
      body["audio_reference"] = params.audioReference.url;
    } else if (props["refers"]) {
      const refers = (body["refers"] ??= []) as { url: string; type: string }[];
      refers.push({ url: params.audioReference.url, type: "audio" });
    }
  }

  const submitRes = await fetch(`${MEDIA_BASE}/model/generateVideo`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!submitRes.ok) {
    throw new Error(`Atlas Cloud video submit failed: ${submitRes.status} ${await submitRes.text()}`);
  }
  const submitted = (await submitRes.json()) as AtlasVideoSubmitResponse;
  const predictionId = submitted.data?.id;
  if (!predictionId) {
    throw new Error("Atlas Cloud video submit returned no prediction id");
  }

  const { outputs, cost } = await pollPrediction(predictionId);
  const { buffer, contentType } = await downloadContent(outputs[0]!);

  return {
    buffer,
    contentType: contentType || "video/mp4",
    providerJobId: predictionId,
    cost,
  };
}

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

interface AtlasImageSubmitResponse {
  code?: number;
  data?: { id: string; status: string };
}

/** Guess an image content type from the leading bytes of the buffer. */
function detectImageContentType(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return "image/png";
}

/** Generate an image via Atlas Cloud (async: submit → poll → download). */
export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const schema = await getModelSchema(params.model);
  const props = schema.props;

  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
  };

  // Reference/source images (edit models) — field name varies per model.
  const refs = params.references?.map((r) => r.url) ?? [];
  if (refs.length > 0) {
    if (props["images"]) {
      body["images"] = refs;
    } else if (props["image"]) {
      body["image"] = refs[0];
    } else {
      setParam(body, props, ["input_references", "references"], refs);
    }
  }

  // Resolution — "resolution" on some models, "size" (WxH) on others.
  if (params.resolution) {
    setParam(body, props, ["resolution", "size", "image_size"], params.resolution);
  }
  if (params.aspectRatio) {
    const set = setParam(body, props, ["aspect_ratio", "ratio"], params.aspectRatio);
    // No aspect-ratio field but a size enum? Pick the closest WxH.
    if (!set && props["size"] && body["size"] === undefined) {
      const size = sizeForAspectRatio(props["size"].enum, params.aspectRatio);
      if (size) body["size"] = size;
    }
  }

  const submitRes = await fetch(`${MEDIA_BASE}/model/generateImage`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!submitRes.ok) {
    throw new Error(`Atlas Cloud image submit failed: ${submitRes.status} ${await submitRes.text()}`);
  }
  const submitted = (await submitRes.json()) as AtlasImageSubmitResponse;
  const predictionId = submitted.data?.id;
  if (!predictionId) {
    throw new Error("Atlas Cloud image submit returned no prediction id");
  }

  const { outputs, cost } = await pollPrediction(predictionId);
  const { buffer, contentType } = await downloadContent(outputs[0]!);

  return {
    buffer,
    contentType: contentType || detectImageContentType(buffer),
    cost,
  };
}

// ---------------------------------------------------------------------------
// Face swap via image-edit model
// ---------------------------------------------------------------------------

const asDataUrl = (buffer: Buffer, mime: string) => `data:${mime};base64,${buffer.toString("base64")}`;

/**
 * Face swap via a diffusion image-edit model on Atlas Cloud (e.g. FLUX, Nano
 * Banana). The frame is the base image and the avatar is a reference, so the
 * model re-renders the frame with the person's face. Accepts a `context` prompt.
 */
export async function swapFaceWithImageModel(params: SwapFaceParams): Promise<GeneratedImage> {
  const base =
    "You are given two images. IMAGE 1 is the scene to edit. IMAGE 2 is a reference photo of a " +
    "different person. Task: change the identity of the main face in IMAGE 1 so it becomes the " +
    "person from IMAGE 2 — copy IMAGE 2's facial features, bone structure, eyes, nose, mouth and " +
    "overall likeness. " +
    "Keep EVERYTHING ELSE from IMAGE 1 unchanged: the body, pose, the existing hair and beard, " +
    "clothing, framing, camera angle, lighting and background. " +
    "Do NOT import the hair, beard, glasses/sunglasses or accessories from IMAGE 2, and do not add " +
    "any that aren't already in IMAGE 1. " +
    "Match the skin tone and color to IMAGE 1's lighting so the face blends seamlessly. " +
    "Output a photorealistic result with a natural, neutral expression and change nothing other " +
    "than the facial identity. Preserve IMAGE 1's exact framing and aspect ratio.";
  const prompt = params.context?.trim()
    ? `${base}\n\nAdditional guidance from the creator: ${params.context.trim()}`
    : base;
  return generateImage({
    model: params.model,
    prompt,
    aspectRatio: params.aspectRatio,
    references: [
      { url: asDataUrl(params.frame.buffer, params.frame.mime) },
      { url: asDataUrl(params.face.buffer, params.face.mime) },
    ],
  });
}

// ---------------------------------------------------------------------------
// Swap model listing (for the admin model picker)
// ---------------------------------------------------------------------------

export interface SwapModelOption {
  id: string;
  name: string;
  local: boolean;
}

/** Face-swap models: local FaceFusion + Atlas Cloud image models that accept references. */
export async function listSwapModels(): Promise<SwapModelOption[]> {
  const images = await listImageModels();
  const atlascloud = images
    .filter((m) => m.supportsReferences)
    .map((m) => ({ id: m.id, name: m.name, local: false }));
  return [{ id: "facefusion", name: "FaceFusion (local)", local: true }, ...atlascloud];
}
