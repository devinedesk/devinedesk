import { useCallback, useEffect, useRef } from "react";
import { fetchVideo, type Video } from "./api";

/**
 * Poll a video's status with exponential backoff, timeout, and cancellation.
 *
 * - Starts at 3s, backs off to 5s, then caps at 10s.
 * - Stops after `timeoutMs` (default 10 minutes).
 * - Automatically cancels on unmount via AbortController.
 * - Calls `onUpdate` when the video reaches a terminal state (COMPLETED/FAILED).
 *
 * Returns a cancel function for manual cancellation.
 */
export function useVideoPolling(
  videoId: string | null,
  onUpdate: (video: Video) => void,
  options?: { timeoutMs?: number },
): () => void {
  const cancelRef = useRef<AbortController | null>(null);
  const timeoutMs = options?.timeoutMs ?? 10 * 60 * 1000; // 10 min default

  const cancel = useCallback(() => {
    cancelRef.current?.abort();
    cancelRef.current = null;
  }, []);

  useEffect(() => {
    if (!videoId) return;

    const controller = new AbortController();
    cancelRef.current = controller;
    const startTime = Date.now();

    let timer: ReturnType<typeof setTimeout>;
    let currentDelay = 3000; // start at 3s

    async function poll() {
      if (controller.signal.aborted) return;

      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        console.warn(`Video ${videoId} polling timed out after ${timeoutMs}ms`);
        return;
      }

      try {
        const video = await fetchVideo(videoId);
        if (controller.signal.aborted) return;

        if (video.status === "COMPLETED" || video.status === "FAILED") {
          onUpdate(video);
          return; // stop polling
        }

        // Exponential backoff: 3s → 5s → 10s (cap)
        currentDelay = Math.min(currentDelay * 1.5, 10_000);
        timer = setTimeout(poll, currentDelay);
      } catch {
        // Network error — retry with backoff but don't abort immediately
        if (controller.signal.aborted) return;
        currentDelay = Math.min(currentDelay * 1.5, 10_000);
        timer = setTimeout(poll, currentDelay);
      }
    }

    timer = setTimeout(poll, currentDelay);

    return () => {
      controller.abort();
      clearTimeout(timer);
      cancelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, timeoutMs]);

  return cancel;
}

/**
 * Poll multiple IN_PROGRESS videos simultaneously with backoff and timeout.
 * Calls `onUpdate` for each video that reaches a terminal state.
 */
export function useVideoBatchPolling(
  videos: Video[],
  onUpdate: (video: Video) => void,
  options?: { timeoutMs?: number },
): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const timeoutMs = options?.timeoutMs ?? 10 * 60 * 1000;
  const pendingIds = videos.filter((v) => v.status === "IN_PROGRESS").map((v) => v.id);
  const pendingKey = pendingIds.join(",");

  useEffect(() => {
    if (pendingIds.length === 0) return;

    const controller = new AbortController();
    const startTime = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let currentDelay = 3000;

    async function poll() {
      if (controller.signal.aborted) return;

      if (Date.now() - startTime > timeoutMs) {
        console.warn(`Batch polling timed out after ${timeoutMs}ms`);
        return;
      }

      try {
        const updates = await Promise.all(
          pendingIds.map((id) => fetchVideo(id).catch(() => null)),
        );

        if (controller.signal.aborted) return;

        let anyTerminal = false;
        for (const updated of updates) {
          if (updated && (updated.status === "COMPLETED" || updated.status === "FAILED")) {
            onUpdateRef.current(updated);
            anyTerminal = true;
          }
        }

        // If all are terminal, stop polling
        const stillPending = updates.filter((u) => u && u.status === "IN_PROGRESS");
        if (stillPending.length === 0 && anyTerminal) return;

        // Continue with backoff
        currentDelay = Math.min(currentDelay * 1.5, 10_000);
        timer = setTimeout(poll, currentDelay);
      } catch {
        if (controller.signal.aborted) return;
        currentDelay = Math.min(currentDelay * 1.5, 10_000);
        timer = setTimeout(poll, currentDelay);
      }
    }

    timer = setTimeout(poll, currentDelay);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey, timeoutMs]);
}
