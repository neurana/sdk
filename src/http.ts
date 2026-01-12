import { randomUUID } from 'node:crypto';
import {
  HTTP_HEADERS,
  CONTENT_TYPES,
  HTTP_STATUS,
  TIMEOUTS,
  RETRY,
} from './constants/index.js';
import {
  NeuranaError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
  TimeoutError,
} from './errors.js';
import { logger } from './logger.js';
import type { HttpMethod, ApiError } from './types/index.js';

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  userAgent?: string;
}

interface RequestConfig {
  method: HttpMethod;
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
  data?: unknown;
  timeout?: number;
  signal?: AbortSignal;
}

export class HttpClient {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #timeout: number;
  readonly #userAgent: string;

  constructor(config: HttpClientConfig) {
    this.#apiKey = config.apiKey;
    this.#baseUrl = config.baseUrl.replace(/\/$/, '');
    this.#timeout = config.timeout ?? TIMEOUTS.DEFAULT;
    this.#userAgent = config.userAgent ?? 'neurana-sdk/1.0.0';
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>({ method: 'GET', path, params });
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', path, data });
  }

  async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, data });
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', path, data });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', path });
  }

  private async request<T>(config: RequestConfig): Promise<T> {
    const url = this.buildUrl(config.path, config.params);
    const controller = new AbortController();
    const timeout = config.timeout ?? this.#timeout;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.executeWithRetry(url, {
        method: config.method,
        headers: this.buildHeaders(),
        body: config.data ? JSON.stringify(config.data) : undefined,
        signal: config.signal ?? controller.signal,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async executeWithRetry(url: string, init: RequestInit, attempt = 1): Promise<Response> {
    try {
      const response = await fetch(url, init);

      if (this.shouldRetry(response.status, attempt)) {
        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
        return this.executeWithRetry(url, init, attempt + 1);
      }

      return response;
    } catch (error) {
      if (this.isRetryableError(error) && attempt < RETRY.MAX_ATTEMPTS) {
        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
        return this.executeWithRetry(url, init, attempt + 1);
      }
      throw error;
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.#baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private buildHeaders(): Record<string, string> {
    return {
      [HTTP_HEADERS.AUTHORIZATION]: `Bearer ${this.#apiKey}`,
      [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
      [HTTP_HEADERS.ACCEPT]: CONTENT_TYPES.JSON,
      [HTTP_HEADERS.USER_AGENT]: this.#userAgent,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Request-ID': randomUUID(),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: ApiError | null = null;
      if (isJson) {
        try {
          errorData = await response.json() as ApiError;
        } catch {
          logger.debug('Failed to parse error response JSON', undefined, 'http');
        }
      }
      throw this.createHttpError(response, errorData);
    }

    if (!isJson) {
      return await response.text() as T;
    }

    try {
      return await response.json() as T;
    } catch {
      throw new NeuranaError('Failed to parse response', 'PARSE_ERROR', response.status);
    }
  }

  private createHttpError(response: Response, errorData: ApiError | null): NeuranaError {
    const status = response.status;
    const code = errorData?.error?.code ?? 'UNKNOWN_ERROR';
    const message = errorData?.error?.message ?? 'An unexpected error occurred';
    const details = errorData?.error?.details;

    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        return new AuthenticationError(message);
      case HTTP_STATUS.FORBIDDEN:
        return new AuthorizationError(message);
      case HTTP_STATUS.NOT_FOUND:
        return new NotFoundError(message);
      case HTTP_STATUS.UNPROCESSABLE:
      case HTTP_STATUS.BAD_REQUEST:
        return new ValidationError(message, details);
      case HTTP_STATUS.RATE_LIMITED: {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
        return new RateLimitError(isNaN(retryAfter) ? 60 : retryAfter, message);
      }
      default:
        return new NeuranaError(message, code, status, details);
    }
  }

  private handleError(error: unknown): NeuranaError {
    if (error instanceof NeuranaError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new TimeoutError();
      }
      if (error.message.includes('fetch') || error.message.includes('network')) {
        logger.debug('Network error occurred', error, 'http');
        return new NetworkError('Failed to connect to server');
      }
    }

    return new NeuranaError('An unexpected error occurred', 'UNKNOWN_ERROR');
  }

  private shouldRetry(status: number, attempt: number): boolean {
    return attempt < RETRY.MAX_ATTEMPTS && RETRY.RETRYABLE_STATUS.includes(status as typeof RETRY.RETRYABLE_STATUS[number]);
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.name === 'TypeError' || error.message.includes('network');
    }
    return false;
  }

  private calculateDelay(attempt: number): number {
    const delay = RETRY.INITIAL_DELAY * Math.pow(RETRY.BACKOFF_FACTOR, attempt - 1);
    return Math.min(delay, RETRY.MAX_DELAY);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
