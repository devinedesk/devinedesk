import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Security Schemes
const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// ------------------------------------------
// 1. Generate Schema
// ------------------------------------------
export const generateSchema = registry.register('GenerateRequest', z.object({
  prompt: z.string().min(1, 'Missing required parameter: prompt').openapi({ description: 'The prompt to generate from' }),
  model: z.string().optional().openapi({ description: 'The model to use' }),
  parameters: z.record(z.any()).optional().default({}).openapi({ description: 'Additional generation parameters' }),
  type: z.string().optional().default('t2i').openapi({ description: 'Type of generation: t2i, video, lipsync' }),
}));

registry.registerPath({
  method: 'post',
  path: '/api/v1/generate',
  description: 'Generate media based on prompt',
  summary: 'Generate Media',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: generateSchema,
        },
      },
    },
  },
  responses: {
    202: {
      description: 'Job queued successfully',
      content: {
        'application/json': {
          schema: z.object({
            jobId: z.string(),
            status: z.string(),
            message: z.string(),
            cost: z.number(),
          }),
        },
      },
    },
  },
});

// ------------------------------------------
// 2. Execute Workflow Schema
// ------------------------------------------
export const executeWorkflowSchema = registry.register('ExecuteWorkflowRequest', z.object({
  inputs: z.record(z.any()).optional().default({}).openapi({ description: 'Inputs required by the workflow' }),
}));

registry.registerPath({
  method: 'post',
  path: '/api/v1/workflows/{id}/execute',
  description: 'Execute a specific workflow',
  summary: 'Execute Workflow',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Workflow ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: executeWorkflowSchema,
        },
      },
    },
  },
  responses: {
    202: {
      description: 'Workflow queued successfully',
      content: {
        'application/json': {
          schema: z.object({
            runId: z.string(),
            status: z.string(),
            message: z.string(),
          }),
        },
      },
    },
  },
});

// ------------------------------------------
// 3. Get Workflow Run Schema
// ------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/v1/runs/{id}',
  description: 'Get the status and outputs of a workflow run',
  summary: 'Get Workflow Run',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Workflow Run ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Workflow run status',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            status: z.string(),
            outputs: z.any().optional(),
            error: z.string().optional(),
          }),
        },
      },
    },
  },
});

export function generateOpenAPI() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Devinedesk Public API',
      description: 'Public API documentation for the Devinedesk platform.',
    },
  });
}
