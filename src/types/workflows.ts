export interface Step {
  id: string;
  type: string;
  name?: string;
  config: Record<string, unknown>;
  next?: string | null;
  condition?: string;
}

export interface Workflow {
  id: string;
  tenantId: string;
  workflowKey: string;
  name: string;
  description?: string;
  steps: Step[];
  visibility?: "private" | "public";
  status?: "active" | "inactive" | "draft";
  version?: number;
  versionString?: string;
  stepCount?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  workflowUrl?: string;
}

export type CodeRuntime = "python" | "node";

export interface CodeStepConfig {
  runtime: CodeRuntime;
  code: string;
  fileName?: string;
  libs?: string[];
  envKeys?: string[];
  timeout?: number;
}

export interface HttpStepConfig {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface TransformStepConfig {
  expression: string;
  resultPath?: string;
}

export interface DelayStepConfig {
  seconds: number;
}

export interface ConditionStepConfig {
  expression: string;
  trueBranch: string;
  falseBranch: string;
}

export type StepConfig =
  | { type: "code"; config: CodeStepConfig }
  | { type: "http"; config: HttpStepConfig }
  | { type: "transform"; config: TransformStepConfig }
  | { type: "delay"; config: DelayStepConfig }
  | { type: "condition"; config: ConditionStepConfig }
  | { type: string; config: Record<string, unknown> };

export interface CreateStepInput {
  type: string;
  name?: string;
  config:
    | CodeStepConfig
    | HttpStepConfig
    | TransformStepConfig
    | DelayStepConfig
    | ConditionStepConfig
    | Record<string, unknown>;
  next?: string | null;
  condition?: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  steps: CreateStepInput[];
  visibility?: "private" | "public";
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  steps?: CreateStepInput[];
}

export interface UpdateVisibilityRequest {
  visibility: "private" | "public";
}

export type TriggerType = "api" | "webhook" | "cron" | "custom";

export interface TriggerSource {
  type: TriggerType;
  source?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface TriggerWorkflowRequest {
  workflowKey: string;
  input?: Record<string, unknown>;
  trigger?: TriggerSource;
}

export interface TriggerWorkflowResponse {
  success: boolean;
  executionId: string;
  tenantId: string;
  workflowKey: string;
  workflowVersion: number;
  checkStatusUrl: string;
}

export interface ListWorkflowsParams {
  limit?: number;
  offset?: number;
  visibility?: "private" | "public";
  [key: string]: string | number | boolean | undefined;
}
