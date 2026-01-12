export interface ExecutionStatus {
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  output?: unknown;
}

export interface TestStepRequest {
  stepType: string;
  stepConfig: Record<string, unknown>;
  input?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface TestStepResponse {
  executionId: string;
  status: string;
}

export interface Run {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface ListRunsParams {
  limit?: number;
  offset?: number;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}
