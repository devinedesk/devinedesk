import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "@repo/db";
import { env } from "../env.js";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";
import {
  actionCost,
  addCredits,
  allPacks,
  findPack,
  packTotalCredits,
} from "../lib/credits.js";
import {
  createCheckoutSession,
  isDodoConfigured,
  verifyWebhookSignature,
} from "../lib/dodopayments.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const creditsRouter: Router = Router();

// Current balance + recent ledger entries.
creditsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.userId }, select: { credits: true } }),
    prisma.creditTransaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  res.json({ balance: user?.credits ?? 0, transactions });
});

// Available packs + per-action prices + checkout config for the frontend.
creditsRouter.get("/packs", requireAuth, async (_req, res) => {
  const packs = allPacks();
  res.json({
    currency: "INR",
    dodoConfigured: isDodoConfigured(),
    packs: packs.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceInr: p.priceInr,
      credits: packTotalCredits(p),
      baseCredits: p.baseCredits,
      bonusCredits: p.bonusCredits,
    })),
    actionCosts: {
      video: actionCost("video"),
      image: actionCost("image"),
      template_render: actionCost("template_render"),
    },
  });
});

const checkoutSchema = z.object({ packId: z.string().min(1) });

// Create a Dodo Payments checkout session and persist a pending Payment row.
// Rate-limited to prevent checkout-session abuse.
creditsRouter.post(
  "/checkout",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 10, message: "Too many checkout requests. Please slow down." }),
  async (req: AuthedRequest, res) => {
  if (!isDodoConfigured()) {
    res.status(503).json({ error: "Payments are not configured on this server." });
    return;
  }
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  const pack = findPack(parsed.data.packId);
  if (!pack) {
    res.status(404).json({ error: "Unknown pack." });
    return;
  }
  if (!pack.productId) {
    res.status(503).json({
      error: "This pack does not have a Dodo Payments product configured. Set DODO_PRODUCT_IDS in the backend .env.",
    });
    return;
  }

  try {
    const credits = packTotalCredits(pack);

    // Create the Payment row first so we can link the checkout session to it.
    const payment = await prisma.payment.create({
      data: {
        userId: req.userId!,
        packId: pack.id,
        amount: pack.priceInr,
        currency: "INR",
        credits,
        dodoSessionId: "", // filled in after session creation
        status: "CREATED",
      },
    });

    const returnUrl = `${env.FRONTEND_URL[0]}/billing?payment_row=${payment.id}`;

    const session = await createCheckoutSession({
      productId: pack.productId,
      quantity: 1,
      returnUrl,
      metadata: {
        payment_row_id: payment.id,
        user_id: req.userId!,
        pack_id: pack.id,
      },
    });

    // Store the session ID on the Payment row.
    await prisma.payment.update({
      where: { id: payment.id },
      data: { dodoSessionId: session.session_id },
    });

    res.status(201).json({
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
      packId: pack.id,
      packName: pack.name,
      credits,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start checkout";
    console.error("Checkout failed:", message);
    res.status(502).json({ error: message });
  }
});

/**
 * Grant a paid order's credits exactly once. Flips CREATED→PAID atomically; if
 * it was already PAID (e.g. the webhook beat us) we just return the balance.
 * Looks up the Payment row by its internal id (passed via metadata).
 */
async function fulfillPayment(paymentRowId: string): Promise<{ granted: boolean; userId: string } | null> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentRowId },
  });
  if (!payment) return null;

  // Atomically claim the order for fulfillment (only one caller wins).
  const claimed = await prisma.payment.updateMany({
    where: { id: paymentRowId, status: { not: "PAID" } },
    data: { status: "PAID" },
  });
  if (claimed.count === 0) {
    // Already fulfilled by another path — idempotent success.
    return { granted: false, userId: payment.userId };
  }

  const pack = findPack(payment.packId);
  const baseCredits = pack?.baseCredits ?? payment.credits;
  const bonusCredits = pack?.bonusCredits ?? 0;

  await addCredits(payment.userId, baseCredits, "PURCHASE", {
    referenceType: "payment",
    referenceId: payment.id,
    description: `${pack?.name ?? "Credit"} pack`,
  });
  if (bonusCredits > 0) {
    await addCredits(payment.userId, bonusCredits, "BONUS", {
      referenceType: "payment",
      referenceId: payment.id,
      description: `${pack?.name ?? "Credit"} pack bonus`,
    });
  }
  return { granted: true, userId: payment.userId };
}

// Confirm a payment after the user returns from Dodo's hosted checkout.
// The frontend calls this with the payment_row id from the return URL query
// params. The webhook is the primary fulfillment path; this is a fallback so
// the user sees their credits immediately if the webhook hasn't fired yet.
const confirmSchema = z.object({ paymentRowId: z.string().min(1) });

creditsRouter.post("/confirm", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  const { paymentRowId } = parsed.data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentRowId },
    select: { userId: true },
  });
  if (!payment || payment.userId !== req.userId) {
    res.status(404).json({ error: "Payment not found." });
    return;
  }

  const result = await fulfillPayment(paymentRowId);
  if (!result) {
    res.status(404).json({ error: "Payment not found." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { credits: true },
  });
  res.json({ balance: user?.credits ?? 0 });
});

/**
 * Dodo Payments webhook (mounted with a raw body parser BEFORE express.json
 * so the signature can be verified against the exact bytes). Grants credits on
 * `payment.succeeded` — the primary fulfillment path.
 *
 * Uses the Standard Webhooks spec: headers `webhook-id`, `webhook-signature`,
 * `webhook-timestamp`. The signature is HMAC-SHA256 of
 * `${webhook-id}.${webhook-timestamp}.${rawBody}` with the webhook secret.
 */
export async function creditsWebhookHandler(req: Request, res: Response): Promise<void> {
  const webhookId = req.header("webhook-id") ?? "";
  const webhookSignature = req.header("webhook-signature") ?? "";
  const webhookTimestamp = req.header("webhook-timestamp") ?? "";
  const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : "";

  if (!verifyWebhookSignature({ rawBody, webhookId, webhookTimestamp, webhookSignature })) {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  try {
    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: {
        payload_type?: string;
        metadata?: Record<string, string>;
        payment_id?: string;
      };
    };

    if (event.type === "payment.succeeded") {
      const paymentRowId = event.data?.metadata?.payment_row_id;
      if (paymentRowId) {
        // Store the Dodo payment id for traceability.
        if (event.data?.payment_id) {
          await prisma.payment.updateMany({
            where: { id: paymentRowId, dodoPaymentId: null },
            data: { dodoPaymentId: event.data.payment_id },
          });
        }
        await fulfillPayment(paymentRowId);
      }
    }
    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook handling failed:", err instanceof Error ? err.message : err);
    res.status(200).json({ status: "ignored" });
  }
}
