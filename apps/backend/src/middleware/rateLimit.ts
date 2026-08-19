import type { Request, Response, NextFunction } from "express";

/**
 * Lightweight in-memory rate limiter (no external dependency).
 *
 * Uses a sliding-window-per-IP map. Suitable for a single-process deployment
 * (the current architecture — the backend runs as one bun process). For a
 * multi-instance deployment, swap the store for Redis.
 *
 * Usage:
 *   app.post("/api/credits/checkout", rateLimit({ windowMs: 60_000, max: 10 }), handler);
 */

interface RateLimitOptions {
  /** Time window in milliseconds. */
  windowMs: number;
  /** Max requests per IP within the window before 429 is returned. */
  max: number;
  /** Optional message for the 429 response body. */
  message?: string;
}

interface Entry {
  count: number;
  resetAt: number;
}

const stores = new WeakMap<RateLimitOptions, Map<string, Entry>>();

export function rateLimit(opts: RateLimitOptions) {
  // Each call to rateLimit() gets its own store, keyed by the options object.
  let store = stores.get(opts);
  if (!store) {
    store = new Map();
    stores.set(opts, store);
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    let entry = store!.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = { count: 1, resetAt: now + opts.windowMs };
      store!.set(ip, entry);
      return next();
    }

    entry.count++;
    if (entry.count > opts.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: opts.message ?? "Too many requests. Please try again later.",
      });
      return;
    }

    next();
  };
}
