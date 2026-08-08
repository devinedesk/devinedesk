import prisma from '../prisma.js';
import { generateQueue } from '../queue.js';

export class WorkflowService {
  /**
   * Gets a workflow by ID
   */
  static async getWorkflowById(workflowId, userId) {
    if (!workflowId || !userId) return null;
    return prisma.workflow.findUnique({
      where: { id: workflowId, userId },
    });
  }

  /**
   * Gets all workflows for a user
   */
  static async getWorkflows(userId) {
    if (!userId) return [];
    return prisma.workflow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deletes a workflow
   */
  static async deleteWorkflow(workflowId, userId) {
    if (!workflowId || !userId) return false;
    await prisma.workflow.delete({
      where: { id: workflowId, userId },
    });
    return true;
  }

  /**
   * Gets a workflow run
   */
  static async getWorkflowRun(runId, userId) {
    if (!runId || !userId) return null;
    return prisma.workflowRun.findUnique({
      where: { id: runId, userId },
    });
  }

  /**
   * Deletes a workflow run
   */
  static async deleteWorkflowRun(runId, userId) {
    if (!runId || !userId) return false;
    await prisma.workflowRun.delete({
      where: { id: runId, userId },
    });
    return true;
  }

  /**
   * Updates a workflow run status and outputs
   */
  static async updateWorkflowRun(runId, data) {
    if (!runId) return null;
    return prisma.workflowRun.update({
      where: { id: runId },
      data,
    });
  }

  /**
   * Creates or updates a workflow
   */
  static async saveWorkflow(userId, data) {
    if (!userId) throw new Error('User ID required');

    const payload = {
      name: data.name || 'Untitled Workflow',
      description: data.description || '',
      nodes: JSON.stringify(data.nodes || []),
      edges: JSON.stringify(data.edges || []),
      viewport: JSON.stringify(data.viewport || { x: 0, y: 0, zoom: 1 }),
    };

    if (data.id) {
      const updateData = { ...payload };
      if (data.nodes === undefined) delete updateData.nodes;
      if (data.edges === undefined) delete updateData.edges;
      if (data.viewport === undefined) delete updateData.viewport;
      if (data.name === undefined) delete updateData.name;
      if (data.description === undefined) delete updateData.description;

      return prisma.workflow.update({
        where: { id: data.id, userId },
        data: updateData,
      });
    } else {
      return prisma.workflow.create({
        data: { ...payload, userId },
      });
    }
  }

  /**
   * Queues a workflow execution
   */
  static async queueWorkflowRun(workflowId, userId, inputs) {
    if (!userId) throw new Error('User ID required');

    const workflow = await this.getWorkflowById(workflowId, userId);
    if (!workflow) throw new Error('Workflow not found');

    const parsedNodes =
      typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
    const parsedEdges =
      typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges;

    // Pre-calculate cost (5 credits per node except passthrough)
    const nodeCount = parsedNodes.filter((n) => n.type !== 'text-passthrough').length;
    const totalCost = nodeCount * 5;

    // Deduct upfront using BillingService to prevent queue spamming
    const { BillingService } = await import('@/src/lib/services/billingService');
    await BillingService.queueGeneration(userId, totalCost, `Execute Workflow ${workflowId}`);

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        userId: userId,
        status: 'PROCESSING',
      },
    });

    const job = await generateQueue.add(
      'generate',
      {
        action: 'execute-workflow',
        params: {
          workflow: { nodes: parsedNodes, edges: parsedEdges },
          inputs: inputs,
        },
        userId: userId,
        cost: totalCost, // passed down for reference
        authMethod: 'session',
        runId: run.id,
      },
      {
        attempts: 1, // Workflows shouldn't retry globally, nodes should retry internally if needed
      }
    );

    return { run, jobId: job.id };
  }
}
