import type { HttpClient } from "../http.js";
import { ENDPOINTS, SIZE_LIMITS, VALIDATION } from "../constants/index.js";
import { ValidationError } from "../errors.js";
import { logger } from "../logger.js";
import type {
  PaginatedResponse,
  Secret,
  SecretWithValue,
  CreateSecretRequest,
  UpdateSecretRequest,
  ListSecretsParams,
} from "../types/index.js";

const SECRET_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;

function validateSecretName(name: string): void {
  if (!name || typeof name !== "string") {
    throw new ValidationError("Secret name is required");
  }
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > VALIDATION.MAX_NAME_LENGTH) {
    throw new ValidationError("Invalid secret name length");
  }
  if (!SECRET_NAME_PATTERN.test(trimmed)) {
    throw new ValidationError(
      "Secret name must be uppercase with underscores (e.g., API_KEY)"
    );
  }
}

function validateSecretValue(value: string): void {
  if (!value || typeof value !== "string") {
    throw new ValidationError("Secret value is required");
  }
  if (value.length > SIZE_LIMITS.MAX_SECRET_VALUE) {
    throw new ValidationError(
      `Secret value exceeds maximum length of ${SIZE_LIMITS.MAX_SECRET_VALUE}`
    );
  }
}

export class SecretsResource {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  async list(params?: ListSecretsParams): Promise<PaginatedResponse<Secret>> {
    const response = await this.#http.get<{ items: Secret[] }>(
      ENDPOINTS.SECRETS.LIST,
      params
    );
    return {
      data: response.items || [],
      pagination: {
        total: response.items?.length || 0,
        hasMore: false,
      },
    };
  }

  async create(data: CreateSecretRequest): Promise<Secret> {
    validateSecretName(data?.name);
    validateSecretValue(data?.value);
    return this.#http.post<Secret>(ENDPOINTS.SECRETS.CREATE, {
      name: data.name.trim(),
      value: data.value,
    });
  }

  async get(name: string): Promise<SecretWithValue> {
    validateSecretName(name);
    logger.warn("Secret value retrieved", { name: name.trim() }, "security");
    return this.#http.get<SecretWithValue>(ENDPOINTS.SECRETS.GET(name.trim()));
  }

  async update(name: string, data: UpdateSecretRequest): Promise<Secret> {
    validateSecretName(name);
    validateSecretValue(data?.value);
    return this.#http.patch<Secret>(
      ENDPOINTS.SECRETS.UPDATE(name.trim()),
      data
    );
  }

  async delete(name: string): Promise<void> {
    validateSecretName(name);
    return this.#http.delete(ENDPOINTS.SECRETS.DELETE(name.trim()));
  }
}
