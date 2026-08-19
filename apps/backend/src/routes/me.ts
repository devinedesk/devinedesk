import { Router } from "express";
import { prisma } from "@repo/db";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";
import { resolveIsAdmin, isSuperAdminEmail } from "../middleware/requireAdmin.js";
import { deleteObjects } from "../lib/storage.js";

export const meRouter: Router = Router();

// Current user's profile + admin status + credit balance (used by the frontend
// to gate admin UI and show the credit balance in the navbar).
meRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const [isAdmin, user] = await Promise.all([
    resolveIsAdmin(req.userId!, req.userEmail),
    prisma.user.findUnique({ where: { id: req.userId }, select: { credits: true } }),
  ]);
  res.json({
    id: req.userId,
    email: req.userEmail,
    isAdmin,
    isSuperAdmin: isSuperAdminEmail(req.userEmail),
    credits: user?.credits ?? 0,
  });
});

/**
 * Delete the current user's account and all associated data (GDPR right to erasure).
 * Cascading FKs remove sessions, accounts, videos, images, face swaps, avatars,
 * templates, template renders, credit transactions, and payments. We also
 * best-effort delete all MinIO objects the user owned before removing the DB rows.
 */
meRouter.delete("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  // Gather all object keys before the cascade deletes the rows.
  const [videos, images, faceSwaps, avatars, templates] = await Promise.all([
    prisma.video.findMany({ where: { userId }, select: { startFrameKey: true, endFrameKey: true, referenceFrameKeys: true, videoKey: true } }),
    prisma.image.findMany({ where: { userId }, select: { referenceImageKeys: true, imageKey: true } }),
    prisma.faceSwap.findMany({ where: { userId }, select: { sourceKey: true, targetKey: true, outputKey: true } }),
    prisma.avatar.findMany({ where: { userId }, select: { sourceImageKeys: true, faceKey: true } }),
    prisma.template.findMany({
      where: { creatorId: userId },
      include: {
        blocks: { select: { startImageKey: true, endImageKey: true, swappedStartKey: true, swappedEndKey: true, videoKey: true, sourceVideoKey: true } },
        audioClips: { select: { audioKey: true } },
      },
    }),
  ]);

  const keys: (string | null | undefined)[] = [
    ...videos.flatMap((v) => [v.startFrameKey, v.endFrameKey, v.videoKey, ...v.referenceFrameKeys]),
    ...images.flatMap((i) => [i.imageKey, ...i.referenceImageKeys]),
    ...faceSwaps.flatMap((f) => [f.sourceKey, f.targetKey, f.outputKey]),
    ...avatars.flatMap((a) => [...a.sourceImageKeys, a.faceKey]),
    ...templates.flatMap((t) => [
      t.previewVideoKey, t.thumbnailKey,
      ...t.blocks.flatMap((b) => [b.startImageKey, b.endImageKey, b.swappedStartKey, b.swappedEndKey, b.videoKey, b.sourceVideoKey]),
      ...t.audioClips.map((a) => a.audioKey),
    ]),
  ];

  // Delete the user (cascades to all related rows).
  await prisma.user.delete({ where: { id: userId } });

  // Best-effort cleanup of stored objects.
  await deleteObjects(keys);

  res.status(204).end();
});
