import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { imageToPng } from "./ffmpeg.js";
import { uploadBuffer } from "./storage.js";

/** Shared multer instance for in-memory image uploads (reused by every route). */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per image
});

/**
 * Multer instance for uploads that include an audio track. Audio for a multi-
 * minute template can be large, so allow a much higher per-file size.
 */
export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB (covers long WAV/MP3 tracks)
});

/**
 * Multer instance for template-block uploads, which may include a raw video the
 * admin wants to use as-is (instead of an AI-generated clip). Videos can be much
 * larger than images, so allow a higher per-file size.
 */
export const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB (covers uploaded video clips)
});

/**
 * Express error-handling middleware that turns multer failures (e.g. a file that
 * exceeds the size limit) into a clean 400 JSON response instead of crashing the
 * request with an opaque stack trace.
 */
export function uploadErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Upload is too large."
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? `Unexpected file field "${err.field}".`
          : err.message;
    res.status(400).json({ error: message });
    return;
  }
  next(err);
}

/** Map an image mime type to a file extension (defaults to png). */
export const extFromMime = (mime: string): string => {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] ?? "png";
};

/**
 * Sniff an image's real mime type from its magic bytes (defaults to png).
 * Needed when building data URLs from stored buffers — declaring the wrong
 * type (e.g. jpeg for PNG bytes) makes providers reject the image.
 */
export function mimeFromBuffer(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buffer.length >= 6) {
    const sig = buffer.toString("ascii", 0, 6);
    if (sig === "GIF87a" || sig === "GIF89a") return "image/gif";
  }
  // ISO-BMFF family (AVIF / HEIC): "ftyp" box at offset 4, brand at offset 8.
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (["heic", "heix", "hevc", "mif1", "msf1"].includes(brand)) return "image/heic";
  }
  return "image/png";
}

/** Thrown when an uploaded image can't be read or transcoded (corrupt/unsupported). */
export class UnsupportedImageError extends Error {
  constructor() {
    super("An uploaded image is corrupt or in an unsupported format.");
    this.name = "UnsupportedImageError";
  }
}

/** Formats providers can reliably parse; anything else is transcoded to PNG. */
const PROVIDER_SAFE_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Normalize an uploaded image to a provider-safe format: sniff the real type
 * from magic bytes (browser mimetypes and file extensions lie — an AVIF saved
 * as ".png" is common) and transcode anything else to PNG via ffmpeg.
 */
export async function normalizeImage(buffer: Buffer): Promise<{ buffer: Buffer; mime: string }> {
  const mime = mimeFromBuffer(buffer);
  if (PROVIDER_SAFE_IMAGE_MIMES.has(mime)) return { buffer, mime };
  try {
    return { buffer: await imageToPng(buffer), mime: "image/png" };
  } catch {
    throw new UnsupportedImageError();
  }
}

/** Data URL for an image buffer, declaring its real mime type. */
export const imageDataUrl = (buffer: Buffer, mime: string): string =>
  `data:${mime};base64,${buffer.toString("base64")}`;

/**
 * Normalize an uploaded image file and persist it to the object store.
 * Throws UnsupportedImageError for corrupt/unsupported files.
 */
export async function storeNormalizedImage(
  file: Express.Multer.File,
  prefix: string,
): Promise<{ key: string; buffer: Buffer; mime: string }> {
  const { buffer, mime } = await normalizeImage(file.buffer);
  const key = await uploadBuffer(buffer, mime, prefix, extFromMime(mime));
  return { key, buffer, mime };
}

/** Encode an uploaded file as a base64 data URL (sent to providers that can't reach MinIO). */
export const toDataUrl = (file: Express.Multer.File): string =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
