<p align="center">
  <img src="https://neurana.io/logo.svg" alt="Neurana" width="200" />
</p>

<h1 align="center">Neurana SDK</h1>

<p align="center">
  <strong>Official TypeScript/JavaScript SDK for the Neurana AI Workflow Automation Platform</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@neurana/sdk"><img src="https://img.shields.io/npm/v/@neurana/sdk.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@neurana/sdk"><img src="https://img.shields.io/npm/dm/@neurana/sdk.svg" alt="npm downloads" /></a>
  <a href="https://github.com/neurana/sdk/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@neurana/sdk.svg" alt="license" /></a>
  <a href="https://github.com/neurana/sdk"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg" alt="TypeScript" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#support">Support</a>
</p>

---

## Overview

Neurana is a powerful AI-driven workflow automation platform that enables you to build, deploy, and manage serverless workflows at scale.

- ⚡ **Execute Serverless Workflows** — Run complex automation pipelines with zero infrastructure
- 🔐 **Secure Secret Management** — Store and access sensitive credentials safely
- 📁 **Code Management** — Upload and version Python/Node.js code for workflow steps
- 📊 **Full Observability** — Monitor executions with real-time WebSocket updates
- 🔑 **API Key Management** — Create scoped keys with granular permissions

## Installation

```bash
npm install @neurana/sdk
```

```bash
yarn add @neurana/sdk
```

```bash
pnpm add @neurana/sdk
```

## Quick Start

```typescript
import { NeuranaClient } from '@neurana/sdk';

const neurana = new NeuranaClient({
  apiKey: process.env.NEURANA_API_KEY,
});

// List workflows
const { data: workflows } = await neurana.workflows.list();

// Trigger a workflow
const { executionId } = await neurana.workflows.trigger('my-workflow', {
  message: 'Hello from SDK!',
});

// Check execution status
const status = await neurana.executions.getStatus(executionId);
console.log(`Status: ${status.status}`);
```

## Configuration

```typescript
const neurana = new NeuranaClient({
  apiKey: 'your-api-key',
  
  // Optional: Custom endpoints
  baseUrl: 'https://workflows.neurana.io',
  mainApiUrl: 'https://api.neurana.io',
  
  // Optional: Request timeout (default: 30000ms)
  timeout: 30000,
  
  // Optional: Allow HTTP for local development
  allowInsecureHttp: false,
});
```

## API Reference

### Workflows

```typescript
// List all workflows
const { data, pagination } = await neurana.workflows.list({ limit: 20 });

// Get workflow by key
const workflow = await neurana.workflows.get('workflow-key');

// Create a workflow with inline code
const workflow = await neurana.workflows.create({
  name: 'Data Processor',
  description: 'Process incoming data',
  steps: [
    {
      id: 'process',
      name: 'Process Data',
      type: 'code',
      config: {
        runtime: 'python',
        code: `
def handler(event, context):
    return {"processed": True, "data": event}
`,
      },
    },
  ],
});

// Update workflow
await neurana.workflows.update('workflow-key', {
  name: 'Updated Name',
  enabled: true,
});

// Delete workflow
await neurana.workflows.delete('workflow-key');

// Trigger workflow execution
const { executionId } = await neurana.workflows.trigger('workflow-key', {
  orderId: 'ORD-12345',
  items: [{ sku: 'PROD-001', qty: 2 }],
});
```

### Executions

```typescript
// Get execution status
const status = await neurana.executions.getStatus('execution-id');

// List all runs
const { data: runs } = await neurana.executions.listRuns({ limit: 50 });

// List runs for specific workflow
const { data: workflowRuns } = await neurana.executions.listWorkflowRuns('workflow-key');

// Test a step in isolation
const result = await neurana.executions.testStep({
  stepType: 'http',
  stepConfig: {
    url: 'https://api.example.com/data',
    method: 'GET',
  },
});
```

### Code Management

```typescript
// Upload code file
const file = await neurana.code.upload({
  fileName: 'processor.py',
  content: 'def handler(event, context): return event',
  language: 'python',
});

// List code files
const { data: files } = await neurana.code.list();

// Get code file with download URL
const code = await neurana.code.get('file-key');

// Get version history
const { data: history } = await neurana.code.getHistoryByKey('file-key');

// Delete code file
await neurana.code.delete('file-key');
```

### Secrets

```typescript
// Create a secret
await neurana.secrets.create({
  name: 'OPENAI_API_KEY',
  value: 'sk-...',
});

// List secrets (values hidden)
const { data: secrets } = await neurana.secrets.list();

// Get secret with value
const secret = await neurana.secrets.get('OPENAI_API_KEY');

// Update secret
await neurana.secrets.update('OPENAI_API_KEY', { value: 'sk-new-value' });

// Delete secret
await neurana.secrets.delete('OPENAI_API_KEY');
```

### API Keys

```typescript
// Create API key with permissions
const { apiKey } = await neurana.apiKeys.create({
  name: 'Production Backend',
  permissions: ['workflows:read', 'workflows:trigger', 'runs:read'],
  expiresInDays: 90,
  rateLimit: 10000,
});

// List API keys
const { data: keys } = await neurana.apiKeys.list();

// Rotate key (24h grace period)
const { apiKey: newKey } = await neurana.apiKeys.rotate('key-id');

// Revoke key immediately
await neurana.apiKeys.revoke('key-id');

// Get usage statistics
const usage = await neurana.apiKeys.getUsage('key-id');
```

#### Available Permissions

| Permission | Description |
|------------|-------------|
| `workflows:read` | View workflows |
| `workflows:write` | Create/update workflows |
| `workflows:trigger` | Execute workflows |
| `workflows:delete` | Delete workflows |
| `code:read` | View code files |
| `code:write` | Upload code |
| `secrets:read` | Access secrets |
| `runs:read` | View execution history |

## Error Handling

```typescript
import { 
  NeuranaClient,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  NeuranaError,
} from '@neurana/sdk';

try {
  await neurana.workflows.trigger('my-workflow');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid or expired API key');
  } else if (error instanceof ValidationError) {
    console.error('Invalid request:', error.message);
  } else if (error instanceof NotFoundError) {
    console.error('Workflow not found');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof NeuranaError) {
    console.error(`Error [${error.code}]: ${error.message}`);
  }
}
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  Workflow,
  WorkflowStep,
  ExecutionStatus,
  ApiKey,
  Secret,
  CodeFile,
  Run,
  PaginatedResponse,
} from '@neurana/sdk';
```

## Examples

### Webhook Handler (Next.js)

```typescript
import { NeuranaClient } from '@neurana/sdk';

const neurana = new NeuranaClient({
  apiKey: process.env.NEURANA_API_KEY,
});

export async function POST(req: Request) {
  const payload = await req.json();
  
  const { executionId } = await neurana.workflows.trigger(
    'process-webhook',
    payload
  );
  
  return Response.json({ executionId });
}
```

### Polling for Completion

```typescript
async function waitForCompletion(executionId: string, timeoutMs = 60000) {
  const start = Date.now();
  
  while (Date.now() - start < timeoutMs) {
    const status = await neurana.executions.getStatus(executionId);
    
    if (status.status === 'SUCCEEDED') return status.output;
    if (status.status === 'FAILED') throw new Error(status.error);
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  throw new Error('Execution timed out');
}
```

### Environment-Based Configuration

```typescript
const neurana = new NeuranaClient({
  apiKey: process.env.NODE_ENV === 'production'
    ? process.env.NEURANA_PROD_KEY
    : process.env.NEURANA_DEV_KEY,
});
```

## Resources Summary

| Resource | Methods |
|----------|---------|
| `workflows` | `list`, `get`, `create`, `update`, `delete`, `trigger`, `updateVisibility` |
| `executions` | `getStatus`, `listRuns`, `listTestRuns`, `listWorkflowRuns`, `testStep` |
| `code` | `list`, `get`, `upload`, `delete`, `listHistory`, `getHistoryByKey` |
| `secrets` | `list`, `get`, `create`, `update`, `delete` |
| `apiKeys` | `list`, `get`, `create`, `update`, `delete`, `rotate`, `revoke`, `getUsage`, `validate` |

## Requirements

- Node.js 18+
- TypeScript 5.0+ (for TypeScript users)

## Security

- HTTPS enforced for all non-localhost connections
- API keys never logged
- Request tracing via `X-Request-ID` header
- Sensitive data redacted from logs

## Support

- 📚 [Documentation](https://neurana.io/docs)
- 🐛 [GitHub Issues](https://github.com/neurana/sdk/issues)

## License

MIT © [Neurana](https://neurana.io)
