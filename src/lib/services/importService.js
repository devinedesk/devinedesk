import prisma from '@/src/lib/prisma';
import { logger } from '../logger';

export class ImportService {
  /**
   * Processes a data import for a user from an uploaded JSON file.
   * Maps old IDs to new IDs to avoid conflicts.
   */
  static async processUserImport(userId, importData) {
    try {
      logger.info({ userId }, 'Starting user data import process');

      if (!importData || typeof importData !== 'object' || !importData.metadata) {
        throw new Error('Invalid import file format');
      }

      const { workspaces = [], workflows = [] } = importData;

      await prisma.$transaction(async (tx) => {
        // 1. Import Workflows (these are tied directly to User)
        if (workflows.length > 0) {
          logger.info({ userId, count: workflows.length }, 'Importing workflows');
          
          for (const oldWorkflow of workflows) {
            await tx.workflow.create({
              data: {
                userId: userId,
                name: `${oldWorkflow.name} (Imported)`,
                description: oldWorkflow.description,
                nodes: oldWorkflow.nodes || [],
                edges: oldWorkflow.edges || [],
                viewport: oldWorkflow.viewport || {},
                isPublic: false,
                tags: oldWorkflow.tags
              }
            });
          }
        }

        // 2. Import Workspaces
        // A user needs an organization to attach workspaces to. 
        // We'll find their first organization (or personal org) to attach imported workspaces.
        if (workspaces.length > 0) {
          logger.info({ userId, count: workspaces.length }, 'Importing workspaces');
          
          const userOrg = await tx.organizationMember.findFirst({
            where: { userId },
            select: { organizationId: true }
          });

          if (userOrg) {
            for (const oldWorkspace of workspaces) {
              // Ensure slug is unique by appending random string
              const uniqueSlug = `${oldWorkspace.slug}-imported-${Math.random().toString(36).substring(7)}`;
              
              const newWorkspace = await tx.workspace.create({
                data: {
                  organizationId: userOrg.organizationId,
                  name: `${oldWorkspace.name} (Imported)`,
                  slug: uniqueSlug
                }
              });

              // Add the user as an owner of the imported workspace
              await tx.workspaceMember.create({
                data: {
                  workspaceId: newWorkspace.id,
                  userId: userId,
                  role: 'OWNER'
                }
              });
            }
          } else {
            logger.warn({ userId }, 'User has no organization, skipping workspace import');
          }
        }
      });

      logger.info({ userId }, 'User data import completed successfully');
      
      return { success: true, message: 'Import completed successfully' };
    } catch (error) {
      logger.error({ userId, error }, 'Failed to process user data import');
      throw error;
    }
  }
}
