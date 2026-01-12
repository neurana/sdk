import type { HttpClient } from "../http.js";
import { ENDPOINTS } from "../constants/index.js";
import { ValidationError } from "../errors.js";
import type {
  PaginatedResponse,
  ExecutionStatus,
  TestStepRequest,
  TestStepResponse,
  Run,
  ListRunsParams,
} from "../types/index.js";

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_ID_LENGTH = 64;

function validateId(id: string, field = "id"): void {
  if (!id || typeof id !== "string") {
    throw new ValidationError(`${field} is required`);
  }
  if (id.length > MAX_ID_LENGTH || !ID_PATTERN.test(id)) {
    throw new ValidationError(`Invalid ${field} format`);
  }
}

export class ExecutionResource {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  async testStep(data: TestStepRequest): Promise<TestStepResponse> {
    if (!data?.stepType?.trim()) {
      throw new ValidationError("stepType is required");
    }
    if (!data?.stepConfig || Object.keys(data.stepConfig).length === 0) {
      throw new ValidationError("stepConfig is required");
    }
    return this.#http.post<TestStepResponse>(
      ENDPOINTS.EXECUTION.TEST_STEP,
      data
    );
  }

  async getStatus(executionId: string): Promise<ExecutionStatus> {
    validateId(executionId, "executionId");
    return this.#http.get<ExecutionStatus>(
      ENDPOINTS.EXECUTION.STATUS(executionId)
    );
  }

  async listRuns(params?: ListRunsParams): Promise<PaginatedResponse<Run>> {
    const response = await this.#http.get<{
      runs: Run[];
      count: number;
      hasMore: boolean;
    }>(ENDPOINTS.RUNS.LIST_ALL, params);
    return {
      data: response.runs || [],
      pagination: {
        total: response.count || 0,
        hasMore: response.hasMore || false,
      },
    };
  }

  async listTestRuns(params?: ListRunsParams): Promise<PaginatedResponse<Run>> {
    const response = await this.#http.get<{
      runs: Run[];
      count: number;
      hasMore: boolean;
    }>(ENDPOINTS.RUNS.LIST_TEST, params);
    return {
      data: response.runs || [],
      pagination: {
        total: response.count || 0,
        hasMore: response.hasMore || false,
      },
    };
  }

  async listWorkflowRuns(
    workflowKey: string,
    params?: ListRunsParams
  ): Promise<PaginatedResponse<Run>> {
    validateId(workflowKey, "workflowKey");
    const response = await this.#http.get<{
      runs: Run[];
      count: number;
      hasMore: boolean;
    }>(ENDPOINTS.RUNS.LIST_WORKFLOW(workflowKey), params);
    return {
      data: response.runs || [],
      pagination: {
        total: response.count || 0,
        hasMore: response.hasMore || false,
      },
    };
  }
}
