# @devinedesk/sdk

The official TypeScript SDK for interacting with the DevineDesk AI Workflow platform.

## Installation

```bash
npm install @devinedesk/sdk
# or
yarn add @devinedesk/sdk
# or
pnpm add @devinedesk/sdk
```

## Quick Start

```typescript
import { DevineDeskClient } from '@devinedesk/sdk';

// Initialize the client
const client = new DevineDeskClient({
  apiKey: process.env.DEVINEDESK_API_KEY, // Get this from your Developer Dashboard
});

async function run() {
  // 1. Execute a workflow
  const { runId } = await client.workflows.execute('wf_123', {
    prompt: 'A futuristic cyberpunk city at night',
    style: 'hyperrealistic',
  });

  console.log('Workflow queued with runId:', runId);

  // 2. Poll for status (Optional: Use Webhooks for better performance)
  let status = 'PROCESSING';
  let result;

  while (status === 'PROCESSING') {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const run = await client.workflows.status(runId);
    status = run.status;
    result = run;
  }

  if (status === 'COMPLETED') {
    console.log('Workflow finished!', result.outputs);
  } else {
    console.error('Workflow failed:', result.error);
  }
}

run();
```

## Security Notice

Your API key carries full privileges for your account. **Never** bundle your API key in client-side code (e.g., React, Vue, or plain HTML files). Always use this SDK on a secure backend server (e.g., Node.js, Next.js API Routes, Express).

## Documentation

For full REST API documentation, Webhook signature verification, and limits, visit the [DevineDesk API Docs](https://devinedesk.com/docs/api).
