const fs = require('fs');

const prismaSchema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
const models = [];
let currentModel = null;

prismaSchema.split('\n').forEach((line) => {
  const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
  if (modelMatch) {
    currentModel = { name: modelMatch[1], fields: [] };
    models.push(currentModel);
    return;
  }
  if (currentModel && line.match(/^\}/)) {
    currentModel = null;
    return;
  }
  if (currentModel) {
    const fieldMatch = line.trim().match(/^(\w+)\s+(\w+)(\??)/);
    if (fieldMatch) {
      currentModel.fields.push({
        name: fieldMatch[1],
        type: fieldMatch[2],
        optional: !!fieldMatch[3],
      });
    }
  }
});

const openApi = {
  openapi: '3.0.0',
  info: {
    title: 'Devinedesk API',
    version: '1.0.0',
    description: 'Enterprise API for Devinedesk Platform.',
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' }, code: { type: 'string' } },
      },
    },
  },
  paths: {},
};

function mapType(prismaType) {
  switch (prismaType) {
    case 'String':
      return { type: 'string' };
    case 'Int':
      return { type: 'integer' };
    case 'Float':
      return { type: 'number' };
    case 'Boolean':
      return { type: 'boolean' };
    case 'DateTime':
      return { type: 'string', format: 'date-time' };
    default:
      return { type: 'string' };
  }
}

models.forEach((model) => {
  const schema = { type: 'object', properties: {} };
  model.fields.forEach((f) => {
    schema.properties[f.name] = mapType(f.type);
  });
  openApi.components.schemas[model.name] = schema;

  const pathName = '/' + model.name.toLowerCase() + 's';
  openApi.paths[pathName] = {
    get: {
      summary: `List ${model.name}s`,
      security: [{ bearerAuth: [] }, { apiKey: [] }],
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: `#/components/schemas/${model.name}` } },
            },
          },
        },
      },
    },
  };
});

fs.writeFileSync(
  'app/api/openapi.json/route.js',
  `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(${JSON.stringify(openApi, null, 2)});
}
`
);
console.log('OpenAPI updated!');
