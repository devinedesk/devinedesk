import prisma from '@/src/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../logger';

export class ExportService {
  /**
   * Generates a data export for a user.
   * In a real enterprise system, this would upload to S3 and email a presigned URL.
   * For local demonstration, this writes to the local /tmp folder or /public/exports.
   */
  static async processUserExport(userId) {
    try {
      logger.info({ userId }, 'Starting user data export generation');

      // Aggregate User Data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          workspaces: true,
          apiKeys: true,
          workflows: {
            include: { runs: true }
          },
        }
      });

      if (!user) throw new Error('User not found');

      const exportData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0'
        },
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        workspaces: user.workspaces,
        workflows: user.workflows,
        apiKeys: user.apiKeys.map(k => ({ ...k, key: undefined })) // Remove hashed keys from export
      };

      // Mock generation of a secure ZIP file (in this implementation we just save JSON)
      const exportId = `export_${userId}_${Date.now()}`;
      const exportDir = path.join(process.cwd(), 'public', 'exports');
      
      await fs.mkdir(exportDir, { recursive: true });
      const filePath = path.join(exportDir, `${exportId}.json`);
      
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));

      logger.info({ userId, filePath }, 'User export completed successfully');
      
      return { success: true, url: `/exports/${exportId}.json` };
    } catch (error) {
      logger.error({ userId, error }, 'Failed to process user export');
      throw error;
    }
  }
}
