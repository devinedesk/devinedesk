import crypto from "node:crypto";
import { env } from "../env.js";

/**
 * Minimal Dodo Payments client over the REST API — no SDK dependency.
 *  - createCheckoutSession: creates a hosted checkout session, returns the URL
 *    the user is redirected to.
 *  - verifyWebhookSignature: validates webhook callbacks (Standard Webhooks
 *    HMAC-SHA256).
 *
 * Dodo Payments uses hosted checkout (redirect-based). The flow is:
 *  1. Backend creates a checkout session (POST /checkouts) → { session_id, checkout_url }
 *  2. Frontend redirects the user to checkout_url
 *  3. User pays on Dodo's hosted page
 *  4. Dodo redirects back to return_url (the frontend billing page)
 *  5. Webhook `payment.succeeded` fires → backend grants credits
 */

const API_BASE = {
  test_mode: "https://test.dodopayments.com",
  live_mode: "https://live.dodopayments.com",
};

function baseUrl(): string {
  return API_BASE[env.DODO_PAYMENTS_ENVIRONMENT];
}

export function isDodoConfigured(): boolean {
  return Boolean(env.DODO_PAYMENTS_API_KEY);
}

/** Throws a clear error if the Dodo API key isn't set. */
function requireApiKey(): string {
  if (!env.DODO_PAYMENTS_API_KEY) {
    throw new Error(
      "Dodo Payments is not configured. Set DODO_PAYMENTS_API_KEY in the backend .env.",
    );
  }
  return env.DODO_PAYMENTS_API_KEY;
}

export interface DodoCheckoutSession {
  session_id: string;
  checkout_url: string | null;
}

/** Create a Dodo Payments checkout session for a one-time product purchase. */
export async function createCheckoutSession(params: {
  productId: string;
  quantity?: number;
  returnUrl: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string>;
}): Promise<DodoCheckoutSession> {
  const apiKey = requireApiKey();
  const res = await fetch(`${baseUrl()}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_cart: [{ product_id: params.productId, quantity: params.quantity ?? 1 }],
      return_url: params.returnUrl,
      metadata: params.metadata,
      ...(params.customerEmail || params.customerName
        ? {
            customer: {
              ...(params.customerEmail ? { email: params.customerEmail } : {}),
              ...(params.customerName ? { name: params.customerName } : {}),
            },
          }
        : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Dodo checkout session creation failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as DodoCheckoutSession;
}

/**
 * Verify a Dodo Payments webhook signature (Standard Webhooks spec).
 *
 * The signed message is `${webhook-id}.${webhook-timestamp}.${rawBody}`.
 * The signature is HMAC-SHA256 of that message with the webhook secret
 * (base64-decoded; the secret may start with `whsec_`).
 *
 * The `webhook-signature` header contains one or more `v1,sig=<base64>` entries
 * separated by spaces. We accept the webhook if any signature matches.
 */
export function verifyWebhookSignature(params: {
  rawBody: string;
  webhookId: string;
  webhookTimestamp: string;
  webhookSignature: string;
}): boolean {
  if (!env.DODO_PAYMENTS_WEBHOOK_KEY) return false;

  // Strip the `whsec_` prefix if present and base64-decode the secret.
  const secretRaw = env.DODO_PAYMENTS_WEBHOOK_KEY;
  const secretB64 = secretRaw.startsWith("whsec_") ? secretRaw.slice(6) : secretRaw;
  const secretBytes = Buffer.from(secretB64, "base64");

  const message = `${params.webhookId}.${params.webhookTimestamp}.${params.rawBody}`;
  const expectedSig = crypto
    .createHmac("sha256", secretBytes)
    .update(message)
    .digest("base64");

  // Parse signatures from the header. The Standard Webhooks spec uses
  // "v1,sig=<base64>" but Dodo Payments sends "v1,<base64>" (without the
  // "sig=" prefix). Handle both formats.
  const signatures = params.webhookSignature
    .split(" ")
    .map((s) => {
      const parts = s.split(",");
      // Standard Webhooks: "v1,sig=<base64>"
      const sigPart = parts.find((p) => p.startsWith("sig="));
      if (sigPart) return sigPart.slice(4);
      // Dodo Payments: "v1,<base64>" — the second part is the signature
      if (parts.length >= 2 && parts[0] === "v1") return parts[1];
      return null;
    })
    .filter((s): s is string => s !== null);

  return signatures.some((sig) => timingSafeEqualBase64(sig, expectedSig));
}

/** Constant-time comparison for base64 strings. */
function timingSafeEqualBase64(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
