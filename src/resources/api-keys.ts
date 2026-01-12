import type { HttpClient } from '../http.js';
import { ENDPOINTS, VALIDATION } from '../constants/index.js';
import { ValidationError } from '../errors.js';
import type {
  PaginatedResponse,
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  UpdateApiKeyRequest,
  RotateApiKeyRequest,
  RotateApiKeyResponse,
  ListApiKeysParams,
  ApiKeyUsageStats,
  ValidateApiKeyResponse,
} from '../types/index.js';

const ID_PATTERN = /^key_[a-zA-Z0-9_-]+$/;
const MAX_ID_LENGTH = 64;

function validateId(id: string, field = 'id'): void {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`${field} is required`);
  }
  if (id.length > MAX_ID_LENGTH) {
    throw new ValidationError(`${field} exceeds maximum length`);
  }
  if (!ID_PATTERN.test(id)) {
    throw new ValidationError(`Invalid ${field} format`);
  }
}

function validateApiKey(key: string): void {
  if (!key || typeof key !== 'string') {
    throw new ValidationError('API key is required');
  }
  if (key.length < VALIDATION.MIN_API_KEY_LENGTH || key.length > VALIDATION.MAX_API_KEY_LENGTH) {
    throw new ValidationError('Invalid API key length');
  }
}

export class ApiKeysResource {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  async list(params?: ListApiKeysParams): Promise<PaginatedResponse<ApiKey>> {
    return this.#http.get<PaginatedResponse<ApiKey>>(ENDPOINTS.API_KEYS.LIST, params);
  }

  async create(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    if (!data?.name?.trim()) {
      throw new ValidationError('name is required');
    }
    if (!data.permissions?.length) {
      throw new ValidationError('permissions array is required');
    }
    return this.#http.post<CreateApiKeyResponse>(ENDPOINTS.API_KEYS.CREATE, data);
  }

  async get(id: string): Promise<ApiKey> {
    validateId(id);
    return this.#http.get<ApiKey>(ENDPOINTS.API_KEYS.GET(id));
  }

  async update(id: string, data: UpdateApiKeyRequest): Promise<ApiKey> {
    validateId(id);
    if (!data || Object.keys(data).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }
    return this.#http.patch<ApiKey>(ENDPOINTS.API_KEYS.UPDATE(id), data);
  }

  async delete(id: string): Promise<void> {
    validateId(id);
    return this.#http.delete<void>(ENDPOINTS.API_KEYS.DELETE(id));
  }

  async rotate(id: string, options?: RotateApiKeyRequest): Promise<RotateApiKeyResponse> {
    validateId(id);
    return this.#http.post<RotateApiKeyResponse>(ENDPOINTS.API_KEYS.ROTATE(id), options ?? {});
  }

  async revoke(id: string): Promise<void> {
    validateId(id);
    return this.#http.post<void>(ENDPOINTS.API_KEYS.REVOKE(id));
  }

  async getUsage(id: string): Promise<ApiKeyUsageStats> {
    validateId(id);
    return this.#http.get<ApiKeyUsageStats>(ENDPOINTS.API_KEYS.USAGE(id));
  }

  async validate(apiKey: string): Promise<ValidateApiKeyResponse> {
    validateApiKey(apiKey);
    return this.#http.post<ValidateApiKeyResponse>(ENDPOINTS.API_KEYS.VALIDATE, { key: apiKey });
  }
}
