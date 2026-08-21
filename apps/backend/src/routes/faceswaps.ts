import { Router } from "express";
import { prisma, type FaceSwap } from "@repo/db";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";
import { faceSwap } from "../lib/facefusion.js";
import { getPublicUrl, uploadBuffer } from "../lib/storage.js";
import { extFromMime, normalizeImage, upload, UnsupportedImageError } from "../lib/uploads.js";

export const faceSwapsRouter: Router = Router();

/** Serialize a FaceSwap row, attaching public URLs for stored objects. */
function serializeFaceSwap(swap: FaceSwap) {
  return {
    ...swap,
    sourceUrl: getPublicUrl(swap.sourceKey),
    targetUrl: getPublicUrl(swap.targetKey),
    outputUrl: swap.outputKey ? getPublicUrl(swap.outputKey) : null,
  };
}

// List the current user's face swaps.
faceSwapsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const swaps = await prisma.faceSwap.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(swaps.map(serializeFaceSwap));
});

// Fetch a single face swap owned by the current user.
faceSwapsRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const swap = await prisma.faceSwap.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!swap) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeFaceSwap(swap));
});

// Create a face swap: store inputs, call FaceFusion synchronously, store output.
faceSwapsRouter.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "source", maxCount: 1 },
    { name: "target", maxCount: 1 },
  ]),
  async (req: AuthedRequest, res) => {
    const files = (req.files ?? {}) as Record<string, Express.Multer.File[] | undefined>;
    const source = files.source?.[0]; // the face to apply
    const target = files.target?.[0]; // the base image being modified

    if (!source || !target) {
      res.status(400).json({ error: "Both a base image and a face image are required." });
      return;
    }

    // 1. Normalize to provider-safe formats (AVIF/HEIC/GIF → PNG) and persist
    //    both uploaded inputs to the object store.
    let sourceNorm: { buffer: Buffer; mime: string };
    let targetNorm: { buffer: Buffer; mime: string };
    try {
      [sourceNorm, targetNorm] = await Promise.all([
        normalizeImage(source.buffer),
        normalizeImage(target.buffer),
      ]);
    } catch (err) {
      if (err instanceof UnsupportedImageError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
    const [sourceKey, targetKey] = await Promise.all([
      uploadBuffer(sourceNorm.buffer, sourceNorm.mime, "inputs", extFromMime(sourceNorm.mime)),
      uploadBuffer(targetNorm.buffer, targetNorm.mime, "inputs", extFromMime(targetNorm.mime)),
    ]);

    // 2. Create the DB record up front.
    const swap = await prisma.faceSwap.create({
      data: { userId: req.userId!, sourceKey, targetKey, status: "IN_PROGRESS" },
    });

    // 3. Run the swap synchronously via FaceFusion, then store the output.
    try {
      const result = await faceSwap(
        { buffer: sourceNorm.buffer, mimetype: sourceNorm.mime, filename: `source.${extFromMime(sourceNorm.mime)}` },
        { buffer: targetNorm.buffer, mimetype: targetNorm.mime, filename: `target.${extFromMime(targetNorm.mime)}` },
      );

      const ext = extFromMime(result.contentType);
      const outputKey = await uploadBuffer(result.buffer, result.contentType, "faceswaps", ext);

      const updated = await prisma.faceSwap.update({
        where: { id: swap.id },
        data: { status: "COMPLETED", outputKey },
      });
      res.status(201).json(serializeFaceSwap(updated));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Face swap failed";
      console.error("Face swap failed:", message);
      const failed = await prisma.faceSwap.update({
        where: { id: swap.id },
        data: { status: "FAILED", error: message },
      });
      res.status(502).json({ error: message, faceSwap: serializeFaceSwap(failed) });
    }
  },
);
