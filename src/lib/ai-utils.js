/**
 * Executes an async function with exponential backoff retries.
 *
 * @param {Function} fn - The async function to execute.
 * @param {number} maxRetries - Maximum number of retries before failing.
 * @param {number} baseDelayMs - Base delay in milliseconds for backoff.
 * @returns {Promise<any>}
 */
export async function withRetries(fn, maxRetries = 3, baseDelayMs = 1000) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > maxRetries) {
        throw new Error(`Failed after ${maxRetries} retries. Final error: ${error.message}`);
      }

      // Only retry on specific network errors or 429/500/502/503/504
      const isRetryable =
        error.message.includes('429') ||
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504') ||
        error.message.includes('fetch failed');

      if (!isRetryable) {
        throw error; // Fail fast for 400, 401, 403, etc.
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[AI System] Request failed, retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}
