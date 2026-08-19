import nodemailer from "nodemailer";
import { env } from "../env.js";

/**
 * Email sending via SMTP (nodemailer).
 *
 * When SMTP is fully configured (HOST + USER + PASS + FROM), a transporter is
 * created lazily on first use. Without SMTP, email-related features (email
 * verification, password reset) are disabled — the app still works in dev mode.
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

/** Whether SMTP is configured and email sending is enabled. */
export function isEmailConfigured(): boolean {
  return getTransporter() !== null;
}

/** Send an email. Returns true on success, false if SMTP isn't configured or send fails. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.warn("SMTP not configured — skipping email send to", opts.to);
    return false;
  }
  try {
    await t.sendMail({
      from: env.SMTP_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return true;
  } catch (err) {
    console.error("Failed to send email:", err instanceof Error ? err.message : err);
    return false;
  }
}
