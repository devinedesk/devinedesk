/**
 * Publish 2 real templates to the production DB so "Try template" doesn't land
 * on an empty page.  Uses the existing banner videos as admin-uploaded source
 * clips (sourceVideoKey) — no OpenRouter credits required.
 *
 * Run INSIDE the backend Docker container on production:
 *
 *   docker cp apps/backend/scripts/publish-templates.ts <backend>:/app/apps/backend/scripts/
 *   docker exec -it <backend> bun apps/backend/scripts/publish-templates.ts
 *
 * Idempotent: if a template with the same name already exists & is published,
 * it is skipped.  Delete the DB row to re-run.
 */
import { prisma } from "@repo/db";
import { uploadBuffer, downloadObject, getPublicUrl } from "../src/lib/storage.js";
import { generateThumbnail, probeMediaDuration } from "../src/lib/ffmpeg.js";

const ADMIN_EMAIL = "support@devinedesk.com";

/** URLs tried in order to download the banner videos from the frontend. */
const VIDEO_URLS: Record<string, string[]> = {
  "creators-viral": [
    "http://frontend/showcase/templates/creators-viral.mp4",
    "http://localhost/showcase/templates/creators-viral.mp4",
    "https://devinedesk.com/showcase/templates/creators-viral.mp4",
  ],
  "fans-blockbuster": [
    "http://frontend/showcase/templates/fans-blockbuster.mp4",
    "http://localhost/showcase/templates/fans-blockbuster.mp4",
    "https://devinedesk.com/showcase/templates/fans-blockbuster.mp4",
  ],
};

const STILL_URLS = [
  "http://frontend/showcase/stills/img-1.jpg",
  "http://localhost/showcase/stills/img-1.jpg",
  "https://devinedesk.com/showcase/stills/img-1.jpg",
];

interface TemplateSpec {
  name: string;
  description: string;
  thumbnailPrompt: string;
  videoSlug: string;
}

const TEMPLATES: TemplateSpec[] = [
  {
    name: "Go Viral",
    description: "Put yourself in a viral stadium broadcast moment — crowd cam finds you, confetti falls, the crowd erupts.",
    thumbnailPrompt: "A live stadium jumbotron broadcast moment — confident young person in the stands posing as confetti falls and the crowd erupts, broadcast graphics overlay, telephoto broadcast look.",
    videoSlug: "creators-viral",
  },
  {
    name: "Hero Entry",
    description: "Star in a cinematic blockbuster hero entrance — walk through smoke and embers in slow-motion, anamorphic lens flares.",
    thumbnailPrompt: "Cinematic blockbuster hero entrance — a lone figure in a long dark coat walks toward the camera out of a wall of smoke and glowing embers in slow-motion, anamorphic lens flares, dramatic rim lighting.",
    videoSlug: "fans-blockbuster",
  },
];

async function fetchFirst(urls: string[]): Promise<Buffer> {
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) throw new Error(`response too small (${buf.length} bytes)`);
      console.log(`  downloaded ${url} (${(buf.length / 1e6).toFixed(1)} MB)`);
      return buf;
    } catch (err) {
      lastErr = err;
      console.log(`  ${url} failed: ${err instanceof Error ? err.message : err}`);
    }
  }
  throw new Error(`All URLs failed: ${lastErr instanceof Error ? lastErr.message : lastErr}`);
}

async function main() {
  console.log("=== Publishing templates to production DB ===\n");

  // 1. Find the admin user.
  const admin = await prisma.user.findFirst({
    where: { email: { equals: ADMIN_EMAIL, mode: "insensitive" } },
  });
  if (!admin) {
    throw new Error(`Admin user "${ADMIN_EMAIL}" not found in the DB. Sign in first so the account exists.`);
  }
  console.log(`Admin: ${admin.email} (${admin.id})`);

  // 2. Find or create an avatar for the admin.
  let avatar = await prisma.avatar.findFirst({ where: { userId: admin.id } });
  if (!avatar) {
    console.log("  No avatar found — creating a placeholder…");
    const faceBuf = await fetchFirst(STILL_URLS);
    const faceKey = await uploadBuffer(faceBuf, "image/jpeg", "avatars", "jpg");
    avatar = await prisma.avatar.create({
      data: {
        userId: admin.id,
        name: "Admin Avatar",
        sourceImageKeys: [faceKey],
        faceKey,
        status: "COMPLETED",
      },
    });
    console.log(`  Created avatar: ${avatar.id}`);
  } else {
    console.log(`  Using existing avatar: ${avatar.id}`);
  }

  // 3. Process each template.
  for (const spec of TEMPLATES) {
    console.log(`\n--- Template: ${spec.name} ---`);

    // Check if already published.
    const existing = await prisma.template.findFirst({
      where: { name: spec.name, creatorId: admin.id, published: true },
    });
    if (existing) {
      console.log("  Already published — skipping.");
      continue;
    }

    // Download the banner video.
    console.log("  Downloading banner video…");
    const videoBuf = await fetchFirst(VIDEO_URLS[spec.videoSlug]!);

    // Probe duration.
    const duration = Math.max(1, Math.round(await probeMediaDuration(videoBuf)));
    console.log(`  Duration: ${duration}s`);

    // Upload video to MinIO.
    const sourceVideoKey = await uploadBuffer(videoBuf, "video/mp4", "templates/uploads", "mp4");
    console.log(`  Uploaded source video: ${sourceVideoKey}`);

    // Also upload as the preview/render video (same content).
    const previewVideoKey = await uploadBuffer(videoBuf, "video/mp4", "templates/renders", "mp4");

    // Generate thumbnail (ffmpeg frame grab at 1s).
    const thumbBuf = await generateThumbnail(videoBuf, 1);
    const thumbnailKey = await uploadBuffer(thumbBuf, "image/jpeg", "templates/thumbnails", "jpg");
    console.log(`  Generated thumbnail: ${thumbnailKey}`);

    // Create the template.
    const template = await prisma.template.create({
      data: {
        creatorId: admin.id,
        name: spec.name,
        description: spec.description,
        avatarSlots: 1,
        avatarIds: [avatar.id],
        thumbnailPrompt: spec.thumbnailPrompt,
        published: true,
        previewVideoKey,
        thumbnailKey,
      },
    });
    console.log(`  Created template: ${template.id}`);

    // Create one block with the source video.
    const block = await prisma.templateBlock.create({
      data: {
        templateId: template.id,
        order: 0,
        startSec: 0,
        endSec: duration,
        track: 0,
        duration,
        cropStart: 0,
        cropEnd: duration,
        prompt: "",
        model: "",
        avatarSlot: 0,
        faceSwapStart: false,
        faceSwapEnd: false,
        sourceVideoKey,
      },
    });
    console.log(`  Created block: ${block.id}`);

    // Create a completed render row (the admin's reference render).
    const render = await prisma.templateRender.create({
      data: {
        templateId: template.id,
        userId: admin.id,
        avatarIds: [avatar.id],
        avatars: { connect: [{ id: avatar.id }] },
        status: "COMPLETED",
        videoKey: previewVideoKey,
        thumbnailKey,
        cost: 0,
      },
    });
    console.log(`  Created render: ${render.id}`);

    // Verify public URL is accessible.
    const publicUrl = getPublicUrl(previewVideoKey);
    console.log(`  Preview URL: ${publicUrl}`);
  }

  console.log("\n=== Done! ===");
  const published = await prisma.template.findMany({
    where: { published: true },
    select: { id: true, name: true, published: true },
  });
  console.log(`Published templates: ${published.length}`);
  for (const t of published) {
    console.log(`  - ${t.name} (${t.id})`);
  }
}

main().catch((err) => {
  console.error("FATAL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
