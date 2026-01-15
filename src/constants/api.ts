export const API_VERSION = "v1";

export const BASE_URL = "https://workflows.neurana.io";
export const MAIN_API_URL = "https://api.neurana.io";

export const ENDPOINTS = {
  WORKFLOWS: {
    LIST: "/workflows",
    CREATE: "/workflows",
    GET: (id: string) => `/workflows/${id}`,
    UPDATE: (id: string) => `/workflows/${id}`,
    DELETE: (id: string) => `/workflows/${id}`,
    TRIGGER: "/trigger",
    VISIBILITY: (id: string) => `/workflows/${id}/visibility`,
  },
  CODE: {
    LIST: "/upload-code",
    UPLOAD: "/upload-code",
    GET: (fileId: string) => `/upload-code/${encodeURIComponent(fileId)}`,
    DELETE: (fileId: string) => `/upload-code/${encodeURIComponent(fileId)}`,
    HISTORY: "/code-history",
    HISTORY_BY_KEY: (key: string) => `/code-history/${encodeURIComponent(key)}`,
  },
  SECRETS: {
    LIST: "/secrets",
    CREATE: "/secrets",
    GET: (secretId: string) => `/secrets/${encodeURIComponent(secretId)}`,
    UPDATE: (secretId: string) => `/secrets/${encodeURIComponent(secretId)}`,
    DELETE: (secretId: string) => `/secrets/${encodeURIComponent(secretId)}`,
  },
  API_KEYS: {
    LIST: "/api-keys",
    CREATE: "/api-keys",
    GET: (keyId: string) => `/api-keys/${keyId}`,
    UPDATE: (keyId: string) => `/api-keys/${keyId}`,
    DELETE: (keyId: string) => `/api-keys/${keyId}`,
    ROTATE: (keyId: string) => `/api-keys/${keyId}/rotate`,
    REVOKE: (keyId: string) => `/api-keys/${keyId}/revoke`,
    USAGE: (keyId: string) => `/api-keys/${keyId}/usage`,
    VALIDATE: "/api-keys/validate",
  },
  EXECUTION: {
    TEST_STEP: "/test-step-async",
    STATUS: (executionId: string) => `/execution/${executionId}`,
  },
  RUNS: {
    LIST_ALL: "/runs",
    LIST_TEST: "/runs/tests",
    LIST_WORKFLOW: (workflowKey: string) => `/runs/workflows/${workflowKey}`,
  },
} as const;
