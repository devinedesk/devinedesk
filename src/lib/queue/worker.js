import { PrismaClient } from '@prisma/client';
import { ExportService } from '../services/exportService.js';
import { logger } from '../logger.js';

// Instantiate a separate Prisma client for the worker script
const prisma = new PrismaClient();

const POLL_INTERVAL_MS = 5000;
let isShuttingDown = false;

async function checkAutomatedBackups() {
  try {
    // Find users with backup_schedule enabled who haven't had an export recently
    // For a real production app, we'd check a LastBackupAt field, but here we'll 
    // just do a lightweight check on the latest job for simplicity.
    const scheduledUsers = await prisma.setting.findMany({
      where: {
        key: 'backup_schedule',
        value: { in: ['daily', 'weekly', 'monthly'] }
      }
    });

    for (const setting of scheduledUsers) {
      const frequency = setting.value;
      let hoursThreshold = 24;
      if (frequency === 'weekly') hoursThreshold = 24 * 7;
      if (frequency === 'monthly') hoursThreshold = 24 * 30;

      const cutoffTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

      const recentBackup = await prisma.job.findFirst({
        where: {
          queueName: 'exports',
          jobName: 'user_data_export',
          data: { path: ['userId'], equals: setting.userId },
          createdAt: { gt: cutoffTime }
        }
      });

      if (!recentBackup) {
        logger.info({ userId: setting.userId, frequency }, 'Queueing automated backup');
        await prisma.job.create({
          data: {
            queueName: 'exports',
            jobName: 'user_data_export',
            data: { userId: setting.userId, source: 'automated_backup' }
          }
        });
      }
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to check automated backups');
  }
}

let cronCounter = 0;

/**
 * Main polling loop for processing jobs from the Prisma Job table.
 * Simulates a robust queue processor like BullMQ but uses PostgreSQL as the queue.
 */
async function processNextJob() {
  if (isShuttingDown) return;

  // Run the cron-style automated backup check occasionally (e.g. every 12 ticks / 60 seconds)
  cronCounter++;
  if (cronCounter > 12) {
    cronCounter = 0;
    await checkAutomatedBackups();
  }

  try {
    // Transactional select and lock (pseudo-mutex via status update)
    // In PostgreSQL this is typically done via SELECT FOR UPDATE SKIP LOCKED
    // Prisma doesn't support SKIP LOCKED natively yet, so we use a two-step optimistic lock
    const pendingJob = await prisma.job.findFirst({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' }
    });

    if (!pendingJob) {
      setTimeout(processNextJob, POLL_INTERVAL_MS);
      return;
    }

    // Try to claim the job
    const claimedJob = await prisma.job.updateMany({
      where: { id: pendingJob.id, status: 'pending' },
      data: { status: 'processing', startedAt: new Date() }
    });

    // If we didn't update any rows, another worker grabbed it
    if (claimedJob.count === 0) {
      setTimeout(processNextJob, 100);
      return;
    }

    logger.info({ jobId: pendingJob.id, queueName: pendingJob.queueName }, 'Processing job');

    let result = null;

    try {
      // Route the job to the correct processor
      if (pendingJob.queueName === 'exports' && pendingJob.jobName === 'user_data_export') {
        const userId = pendingJob.data?.userId;
        if (!userId) throw new Error('Missing userId in export job data');
        
        result = await ExportService.processUserExport(userId);
      } else {
        throw new Error(`Unknown job router: ${pendingJob.queueName}/${pendingJob.jobName}`);
      }

      // Mark as completed
      await prisma.job.update({
        where: { id: pendingJob.id },
        data: {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          result
        }
      });

      logger.info({ jobId: pendingJob.id }, 'Job completed successfully');

    } catch (jobError) {
      logger.error({ jobId: pendingJob.id, error: jobError }, 'Job failed');
      
      // Mark as failed
      await prisma.job.update({
        where: { id: pendingJob.id },
        data: {
          status: 'failed',
          error: jobError.message,
          completedAt: new Date()
        }
      });
    }

    // Immediately check for more jobs without waiting for polling interval
    setTimeout(processNextJob, 100);

  } catch (error) {
    logger.error({ error }, 'Queue worker polling error');
    setTimeout(processNextJob, POLL_INTERVAL_MS);
  }
}

async function startWorker() {
  logger.info('Starting Background Queue Worker Daemon...');
  await prisma.$connect();
  processNextJob();
}

startWorker();

// Graceful shutdown handling
const handleShutdown = async () => {
  logger.info('Shutting down Queue Worker Daemon...');
  isShuttingDown = true;
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
