import { Router } from "express";
import { minio } from "../lib/storage.js";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";

export const mediaRouter: Router = Router();

const BUCKET = process.env.MINIO_BUCKET ?? "devinedesk";

/**
 * Authenticated media proxy. Streams an object from MinIO to the client.
 * Unlike the public MinIO proxy, this requires a valid session — so it
 * can be used when media should NOT be publicly accessible.
 *
 * Usage: GET /api/media/:key(*)
 * The key is the full object key (e.g. "videos/abc-123.mp4").
 */
mediaRouter.get("/*", requireAuth, async (req: AuthedRequest, res) => {
  const key = req.params[0] ?? "";
  if (!key) {
    res.status(400).json({ error: "Missing object key" });
    return;
  }

  try {
    const stream = await minio.getObject(BUCKET, key);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=3600");
    stream.pipe(res);
  } catch {
    res.status(404).json({ error: "Object not found" });
  }
});
