import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

let transporterInstance = null;
const getTransporter = () => {
  if (transporterInstance) return transporterInstance;
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporterInstance = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporterInstance;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing SMTP_HOST or SMTP_USER environment variables in production. Email functionality requires real credentials in production.'
    );
  }

  transporterInstance = {
    sendMail: async (info) => {
      logger.info(`[MOCK EMAIL] To: ${info.to} | Subject: ${info.subject}`);
      return { messageId: 'mock-id' };
    },
  };
  return transporterInstance;
};

const FROM_ADDRESS = process.env.EMAIL_FROM || '"DevineDesk" <noreply@devinedesk.com>';

export class EmailService {
  /**
   * Send a generic email
   */
  static async sendEmail({ to, subject, html, text }) {
    try {
      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: FROM_ADDRESS,
        to,
        subject,
        text: text || 'Please view this email in an HTML compatible mail client.',
        html,
      });
      logger.info(`Email sent to ${to} (Message ID: ${info.messageId})`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}`, error);
      return false;
    }
  }

  /**
   * Send Welcome Email
   */
  static async sendWelcomeEmail(email, name) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to DevineDesk!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome aboard, ${name || 'Creator'}!</h2>
          <p>We're thrilled to have you join DevineDesk. Your studio is ready to generate incredible images, videos, and workflows.</p>
          <p>To get started, check out our quick start guides in the developer portal.</p>
          <a href="https://devinedesk.com/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Go to Dashboard</a>
        </div>
      `,
    });
  }

  /**
   * Send Payment Receipt
   */
  static async sendReceiptEmail(
    email,
    { amountPaid, currency, creditsAdded, date, isSubscription = false }
  ) {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountPaid);
    const title = isSubscription ? 'Subscription Renewal Receipt' : 'Payment Receipt';

    return this.sendEmail({
      to: email,
      subject: `DevineDesk: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #333; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">${title}</h2>
          <p>Thank you for your purchase!</p>
          <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eaeaea;">
              <td style="padding: 10px 0; color: #666;">Date</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">${date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eaeaea;">
              <td style="padding: 10px 0; color: #666;">Amount Paid</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">Credits Added</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #10b981;">+${creditsAdded}</td>
            </tr>
          </table>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">If you have any questions, please contact billing@devinedesk.com</p>
        </div>
      `,
    });
  }

  /**
   * Send Security/Login Alert
   */
  static async sendSecurityAlert(email, ip, device) {
    return this.sendEmail({
      to: email,
      subject: 'Security Alert: New Login Detected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">New Login Detected</h2>
          <p>We noticed a new login to your DevineDesk account.</p>
          <ul>
            <li><strong>IP Address:</strong> ${ip}</li>
            <li><strong>Device:</strong> ${device}</li>
            <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
          </ul>
          <p>If this was you, you can safely ignore this email. If not, please change your password immediately and enable Two-Factor Authentication.</p>
        </div>
      `,
    });
  }

  /**
   * Send Organization Invite
   */
  static async sendOrganizationInvite(email, inviterName, orgName, inviteLink) {
    return this.sendEmail({
      to: email,
      subject: `You've been invited to join ${orgName} on DevineDesk`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">You've been invited!</h2>
          <p><strong>${inviterName}</strong> has invited you to join the <strong>${orgName}</strong> organization on DevineDesk.</p>
          <p>Click the link below to accept the invitation and join the team:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Join Organization</a>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">If you don't have an account yet, you'll be prompted to create one.</p>
        </div>
      `,
    });
  }
}
