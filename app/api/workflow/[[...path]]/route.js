import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { env } from '@/src/lib/env';
import { z } from 'zod';
import { WorkflowService } from '@/src/lib/services/workflowService';

const createWorkflowSchema = z.object({
  name: z.string().optional().default('Untitled Workflow'),
  description: z.string().optional().default(''),
});

const updateWorkflowNameSchema = z.object({
  name: z.string().min(1),
});

const publishWorkflowSchema = z.object({
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .optional(),
});

const executeWorkflowSchema = z.object({
  inputs: z.record(z.any()).optional().default({}),
});

export const GET = withApiAuth({
  handler: async (request, { auth, params }) => {
    const slug = await params;
    const segments = slug.path || [];

    if (segments[0] === 'get-workflow-defs') {
      const workflows = await WorkflowService.getWorkflows(auth.user.id);
      return NextResponse.json(
        workflows.map((w) => ({
          ...w,
          nodes: typeof w.nodes === 'string' ? JSON.parse(w.nodes || '[]') : w.nodes || [],
          edges: typeof w.edges === 'string' ? JSON.parse(w.edges || '[]') : w.edges || [],
          viewport: w.viewport
            ? typeof w.viewport === 'string'
              ? JSON.parse(w.viewport)
              : w.viewport
            : { x: 0, y: 0, zoom: 1 },
        }))
      );
    }

    if (segments[0] === 'get-workflow-def' && segments[1]) {
      const wf = await WorkflowService.getWorkflowById(segments[1], auth.user.id);
      if (!wf) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
      return NextResponse.json({
        ...wf,
        nodes: typeof wf.nodes === 'string' ? JSON.parse(wf.nodes || '[]') : wf.nodes || [],
        edges: typeof wf.edges === 'string' ? JSON.parse(wf.edges || '[]') : wf.edges || [],
        viewport: wf.viewport
          ? typeof wf.viewport === 'string'
            ? JSON.parse(wf.viewport)
            : wf.viewport
          : { x: 0, y: 0, zoom: 1 },
      });
    }

    if (segments.length === 2 && segments[1] === 'node-schemas') {
      return NextResponse.json({});
    }

    if (segments.length === 2 && segments[1] === 'api-node-schemas') {
      return NextResponse.json({});
    }

    if (segments[0] === 'run' && segments[2] === 'api-outputs') {
      const runId = segments[1];
      const run = await WorkflowService.getWorkflowRun(runId, auth.user.id);

      if (run) {
        return NextResponse.json({
          run_id: run.id,
          status: run.status,
          outputs:
            typeof run.outputs === 'string' ? JSON.parse(run.outputs || '{}') : run.outputs || {},
          node_outputs:
            typeof run.nodeOutputs === 'string'
              ? JSON.parse(run.nodeOutputs || '{}')
              : run.nodeOutputs || {},
          error: run.error,
        });
      }
      return NextResponse.json({ detail: 'Run not found' }, { status: 404 });
    }

    if (segments[0] === 'get-template-workflows') {
      return NextResponse.json([]);
    }

    if (segments[0] === 'get-published-workflows') {
      return NextResponse.json([]);
    }

    if (segments.length === 2 && segments[1] === 'api-inputs') {
      return NextResponse.json({});
    }

    if (segments[0] === 'run' && segments[2] === 'status') {
      const runId = segments[1];
      const run = await WorkflowService.getWorkflowRun(runId, auth.user.id);
      if (run) {
        return NextResponse.json({ status: run.status });
      }
      return NextResponse.json({ detail: 'Run not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  },
});

export const POST = withApiAuth({
  handler: async (request, { auth, body, params }) => {
    // Fallback for body parsing if undefined because no schema was passed to withApiAuth
    let payload = body;
    if (!payload) {
      try {
        payload = await request.clone().json();
      } catch (e) {
        payload = {};
      }
    }

    const slug = await params;
    const segments = slug.path || [];

    if (segments[0] === 'create') {
      const parsed = createWorkflowSchema.safeParse(payload);
      if (!parsed.success)
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.issues },
          { status: 400 }
        );

      const newWf = await WorkflowService.saveWorkflow(auth.user.id, parsed.data);
      return NextResponse.json({
        ...newWf,
        nodes:
          typeof newWf.nodes === 'string' ? JSON.parse(newWf.nodes || '[]') : newWf.nodes || [],
        edges:
          typeof newWf.edges === 'string' ? JSON.parse(newWf.edges || '[]') : newWf.edges || [],
        viewport: newWf.viewport
          ? typeof newWf.viewport === 'string'
            ? JSON.parse(newWf.viewport)
            : newWf.viewport
          : { x: 0, y: 0, zoom: 1 },
      });
    }

    if (segments[0] === 'update-name' && segments[1]) {
      const parsed = updateWorkflowNameSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.issues },
          { status: 400 }
        );
      }
      try {
        const updated = await WorkflowService.saveWorkflow(auth.user.id, {
          id: segments[1],
          name: parsed.data.name,
        });
        return NextResponse.json({
          ...updated,
          nodes:
            typeof updated.nodes === 'string'
              ? JSON.parse(updated.nodes || '[]')
              : updated.nodes || [],
          edges:
            typeof updated.edges === 'string'
              ? JSON.parse(updated.edges || '[]')
              : updated.edges || [],
          viewport: updated.viewport
            ? typeof updated.viewport === 'string'
              ? JSON.parse(updated.viewport)
              : updated.viewport
            : { x: 0, y: 0, zoom: 1 },
        });
      } catch (error) {
        return NextResponse.json({ detail: 'Not found' }, { status: 404 });
      }
    }

    if (segments.length === 2 && segments[1] === 'publish') {
      const parsed = publishWorkflowSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.issues },
          { status: 400 }
        );
      }
      const data = parsed.data;

      const workflowId = segments[0];
      try {
        const updateData = {};
        if (data.nodes) updateData.nodes = JSON.stringify(data.nodes);
        if (data.edges) updateData.edges = JSON.stringify(data.edges);
        if (data.viewport) updateData.viewport = JSON.stringify(data.viewport);

        const updated = await WorkflowService.saveWorkflow(auth.user.id, {
          id: workflowId,
          ...updateData,
        });

        return NextResponse.json({
          ...updated,
          nodes:
            typeof updated.nodes === 'string'
              ? JSON.parse(updated.nodes || '[]')
              : updated.nodes || [],
          edges:
            typeof updated.edges === 'string'
              ? JSON.parse(updated.edges || '[]')
              : updated.edges || [],
          viewport: updated.viewport
            ? typeof updated.viewport === 'string'
              ? JSON.parse(updated.viewport)
              : updated.viewport
            : { x: 0, y: 0, zoom: 1 },
        });
      } catch (error) {
        return NextResponse.json({ detail: 'Not found' }, { status: 404 });
      }
    }

    if (segments.length === 2 && segments[1] === 'api-execute') {
      const parsed = executeWorkflowSchema.safeParse(payload);
      if (!parsed.success)
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.issues },
          { status: 400 }
        );

      try {
        const { run, jobId } = await WorkflowService.queueWorkflowRun(
          segments[0],
          auth.user.id,
          parsed.data.inputs
        );
        return NextResponse.json({ run_id: run.id, status: 'processing', jobId });
      } catch (error) {
        return NextResponse.json(
          { detail: error.message },
          { status: error.message === 'Workflow not found' ? 404 : 500 }
        );
      }
    }

    if (segments.length === 4 && segments[1] === 'node' && segments[3] === 'run') {
      const parsed = executeWorkflowSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.issues },
          { status: 400 }
        );
      }
      const data = parsed.data;

      const workflowId = segments[0];
      const nodeId = segments[2];

      const wf = await WorkflowService.getWorkflowById(workflowId, auth.user.id);
      if (!wf) return NextResponse.json({ detail: 'Workflow not found' }, { status: 404 });

      const parsedWorkflow = {
        ...wf,
        nodes: typeof wf.nodes === 'string' ? JSON.parse(wf.nodes || '[]') : wf.nodes || [],
        edges: typeof wf.edges === 'string' ? JSON.parse(wf.edges || '[]') : wf.edges || [],
      };

      const node = parsedWorkflow.nodes.find((n) => n.id === nodeId);
      if (!node) return NextResponse.json({ detail: 'Node not found' }, { status: 404 });

      try {
        const { executeNode } = await import('@/src/lib/services/workflowEngine');
        const output = await executeNode(node, data.inputs || {}, {}, auth.user.id);
        return NextResponse.json({ success: true, output });
      } catch (e) {
        return NextResponse.json({ detail: e.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  },
});

export const DELETE = withApiAuth({
  handler: async (request, { auth, params }) => {
    const slug = await params;
    const segments = slug.path || [];

    if (segments[0] === 'delete-workflow-def' && segments[1]) {
      try {
        await WorkflowService.deleteWorkflow(segments[1], auth.user.id);
        return NextResponse.json({ success: true });
      } catch (e) {
        return NextResponse.json({ detail: 'Workflow not found' }, { status: 404 });
      }
    }
    if (segments[0] === 'node-run' && segments[1]) {
      try {
        await WorkflowService.deleteWorkflowRun(segments[1], auth.user.id);
        return NextResponse.json({ success: true });
      } catch (e) {
        return NextResponse.json({ detail: 'Run not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  },
});
