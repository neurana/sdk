import type { HttpClient } from '../http.js';
import { ENDPOINTS } from '../constants/index.js';
import { ValidationError } from '../errors.js';
import { logger } from '../logger.js';
import type {
  PaginatedResponse,
  Workflow,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  UpdateVisibilityRequest,
  TriggerWorkflowResponse,
  ListWorkflowsParams,
  CreateStepInput,
  CodeStepConfig,
} from '../types/index.js';

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_ID_LENGTH = 64;

function validateId(id: string, field = 'id'): void {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`${field} is required`);
  }
  if (id.length > MAX_ID_LENGTH || !ID_PATTERN.test(id)) {
    throw new ValidationError(`Invalid ${field} format`);
  }
}

export class WorkflowsResource {
  readonly #http: HttpClient;
  readonly #codeUploader: (fileName: string, content: string, language: string) => Promise<{ key: string }>;
  readonly #sdkBaseUrl?: string;

  constructor(
    http: HttpClient,
    codeUploader?: (fileName: string, content: string, language: string) => Promise<{ key: string }>,
    sdkBaseUrl?: string
  ) {
    this.#http = http;
    this.#codeUploader = codeUploader ?? (async () => {
      throw new ValidationError('Code uploader not configured');
    });
    this.#sdkBaseUrl = sdkBaseUrl;
  }

  private buildWorkflowUrl(tenantId: string, workflowKey: string): string | undefined {
    if (!this.#sdkBaseUrl) return undefined;
    const baseUrl = this.#sdkBaseUrl.replace(/\/$/, '');
    return `${baseUrl}/sdk/${tenantId}/${workflowKey}`;
  }

  private enrichWorkflowResponse(workflow: Workflow): Workflow {
    if (workflow.tenantId && workflow.workflowKey) {
      const workflowUrl = this.buildWorkflowUrl(workflow.tenantId, workflow.workflowKey);
      if (workflowUrl) {
        return { ...workflow, workflowUrl };
      }
    }
    return workflow;
  }

  async list(params?: ListWorkflowsParams): Promise<PaginatedResponse<Workflow>> {
    const response = await this.#http.get<{ success: boolean; workflows: Workflow[]; count: number }>(ENDPOINTS.WORKFLOWS.LIST, params);
    return {
      data: (response.workflows || []).map(w => this.enrichWorkflowResponse(w)),
      pagination: {
        total: response.count || 0,
        limit: params?.limit || 20,
        offset: params?.offset || 0,
      },
    };
  }

  async create(data: CreateWorkflowRequest): Promise<Workflow> {
    if (!data?.name?.trim()) {
      throw new ValidationError('name is required');
    }

    if (!data.steps || data.steps.length === 0) {
      throw new ValidationError('At least one step is required');
    }

    const processedSteps = await this.processSteps(data.steps);

    const workflow = await this.#http.post<Workflow>(ENDPOINTS.WORKFLOWS.CREATE, {
      ...data,
      steps: processedSteps,
    });

    return this.enrichWorkflowResponse(workflow);
  }

  async get(id: string): Promise<Workflow> {
    validateId(id);
    const workflow = await this.#http.get<Workflow>(ENDPOINTS.WORKFLOWS.GET(id));
    return this.enrichWorkflowResponse(workflow);
  }

  async update(id: string, data: UpdateWorkflowRequest): Promise<Workflow> {
    validateId(id);
    if (!data || Object.keys(data).length === 0) {
      throw new ValidationError('Update data is required');
    }

    let processedData: Record<string, unknown> = { ...data };
    if (data.steps && data.steps.length > 0) {
      processedData.steps = await this.processSteps(data.steps);
    }

    const workflow = await this.#http.patch<Workflow>(ENDPOINTS.WORKFLOWS.UPDATE(id), processedData);
    return this.enrichWorkflowResponse(workflow);
  }

  async delete(id: string): Promise<void> {
    validateId(id);
    return this.#http.delete(ENDPOINTS.WORKFLOWS.DELETE(id));
  }

  async updateVisibility(id: string, data: UpdateVisibilityRequest): Promise<Workflow> {
    validateId(id);
    const workflow = await this.#http.patch<Workflow>(ENDPOINTS.WORKFLOWS.VISIBILITY(id), data);
    return this.enrichWorkflowResponse(workflow);
  }

  async trigger(workflowKey: string, input?: Record<string, unknown>): Promise<TriggerWorkflowResponse> {
    validateId(workflowKey, 'workflowKey');
    const body = {
      workflowKey,
      trigger: { type: 'api', source: 'sdk' },
      data: input,
    };
    return this.#http.post<TriggerWorkflowResponse>(ENDPOINTS.WORKFLOWS.TRIGGER, body);
  }

  private async processSteps(steps: CreateStepInput[]): Promise<Record<string, unknown>[]> {
    const processedSteps: Record<string, unknown>[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (step.type === 'code') {
        const codeConfig = step.config as Partial<CodeStepConfig>;

        if (!codeConfig.runtime) {
          throw new ValidationError(`Step ${i + 1}: runtime is required for code steps (python or node)`);
        }

        if (!['python', 'node'].includes(codeConfig.runtime)) {
          throw new ValidationError(`Step ${i + 1}: runtime must be 'python' or 'node'`);
        }

        if (!codeConfig.code?.trim()) {
          throw new ValidationError(`Step ${i + 1}: code content is required for code steps`);
        }

        const extension = codeConfig.runtime === 'python' ? 'py' : 'js';
        const fileName = codeConfig.fileName ?? `step_${i + 1}.${extension}`;

        logger.debug('Uploading code for step', { stepIndex: i, fileName, runtime: codeConfig.runtime }, 'workflows');

        const uploadResult = await this.#codeUploader(
          fileName,
          codeConfig.code,
          codeConfig.runtime === 'python' ? 'python' : 'javascript'
        );

        const { code: _code, fileName: _fileName, ...restConfig } = codeConfig;

        processedSteps.push({
          type: step.type,
          name: step.name,
          config: {
            ...restConfig,
            fileId: uploadResult.key,
          },
          next: step.next,
          condition: step.condition,
        });

        logger.debug('Code uploaded for step', { stepIndex: i, fileId: uploadResult.key }, 'workflows');
      } else {
        processedSteps.push({
          type: step.type,
          name: step.name,
          config: step.config,
          next: step.next,
          condition: step.condition,
        });
      }
    }

    return processedSteps;
  }
}
