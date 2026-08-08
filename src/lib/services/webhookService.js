import prisma from '@/src/lib/prisma.js';
import { logger } from '@/lib/logger.js';
import { QueueService } from '@/src/lib/queue.js';

export class WebhookService {
  /**
   * Dispatches an event payload to all active webhooks registered for the given userId.
   * @param {string} userId - The ID of the user triggering the event.
   * @param {string} event - The event name (e.g., 'workflow.completed').
   * @param {object} payload - The data to send.
   */
  static async dispatchEvent(userId, event, payload) {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
      });

      const matchedWebhooks = webhooks.filter((webhook) => {
        try {
          const subscribedEvents = JSON.parse(webhook.events || '[]');
          return subscribedEvents.includes(event) || subscribedEvents.includes('*');
        } catch (e) {
          return false;
        }
      });

      if (matchedWebhooks.length === 0) return;

      const bodyString = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      // Decoupled: Push each matched webhook to the dedicated webhook-queue
      await Promise.allSettled(
        matchedWebhooks.map(async (webhook) => {
          try {
            await QueueService.addWebhookJob({
              url: webhook.url,
              secret: webhook.secret,
              event: event,
              bodyString: bodyString,
            });
            logger?.info(`Queued webhook job for ${webhook.url} for event ${event}`);
          } catch (err) {
            logger?.error(`Error queuing webhook to ${webhook.url}`, err);
          }
        })
      );
    } catch (err) {
      logger?.error(`Failed to enqueue webhooks for user ${userId}`, err);
    }
  }
}
