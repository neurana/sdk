import type {
  Workflow,
  Secret,
  CodeFile,
  Run,
} from "../../src/types/index.js";

export const FIXTURES = {
  WORKFLOW: {
    VALID: {
      id: "wf_123",
      tenantId: "tenant_abc123",
      workflowKey: "test-workflow",
      name: "Test Workflow",
      description: "A test workflow",
      steps: [
        {
          id: "step_1",
          type: "http",
          name: "HTTP Request",
          config: { url: "https://api.example.com" },
        },
      ],
      visibility: "private",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    } satisfies Workflow,

    LIST: [
      {
        id: "wf_1",
        tenantId: "tenant_abc123",
        workflowKey: "workflow-1",
        name: "Workflow 1",
        steps: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "wf_2",
        tenantId: "tenant_abc123",
        workflowKey: "workflow-2",
        name: "Workflow 2",
        steps: [],
        createdAt: "2026-01-02T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
      },
    ] satisfies Workflow[],
  },

  SECRET: {
    VALID: {
      name: "API_KEY",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    } satisfies Secret,
  },

  CODE: {
    VALID: {
      key: "code_123",
      fileName: "handler.ts",
      language: "typescript",
      size: 1024,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    } satisfies CodeFile,
  },

  RUN: {
    VALID: {
      id: "run_123",
      workflowId: "wf_123",
      status: "completed",
      input: { data: "test" },
      output: { result: "success" },
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-01T00:01:00Z",
    } satisfies Run,
  },

  PAGINATION: {
    DEFAULT: {
      total: 2,
      limit: 20,
      offset: 0,
    },
  },

  ERROR: {
    UNAUTHORIZED: {
      error: { code: "AUTH_FAILED", message: "Authentication failed" },
    },
    NOT_FOUND: {
      error: { code: "NOT_FOUND", message: "Resource not found" },
    },
    RATE_LIMITED: {
      error: { code: "RATE_LIMIT", message: "Rate limit exceeded" },
    },
    VALIDATION: {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: { field: "name", message: "Name is required" },
      },
    },
  },
} as const;
