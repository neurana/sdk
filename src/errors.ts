import { ERROR_CODES, ERROR_MESSAGES } from './constants/index.js';

export class NeuranaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'NeuranaError';
    Object.setPrototypeOf(this, NeuranaError.prototype);
  }

  static fromCode(code: string, statusCode?: number, details?: unknown): NeuranaError {
    const message = ERROR_MESSAGES[code] ?? 'An unknown error occurred';
    return new NeuranaError(message, code, statusCode, details);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class AuthenticationError extends NeuranaError {
  constructor(message = ERROR_MESSAGES[ERROR_CODES.AUTHENTICATION_FAILED]) {
    super(message, ERROR_CODES.AUTHENTICATION_FAILED, 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends NeuranaError {
  constructor(message = ERROR_MESSAGES[ERROR_CODES.AUTHORIZATION_FAILED]) {
    super(message, ERROR_CODES.AUTHORIZATION_FAILED, 403);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends NeuranaError {
  constructor(message = ERROR_MESSAGES[ERROR_CODES.NOT_FOUND]) {
    super(message, ERROR_CODES.NOT_FOUND, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends NeuranaError {
  constructor(message = ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR], details?: unknown) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 422, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class RateLimitError extends NeuranaError {
  constructor(
    public readonly retryAfter: number,
    message = ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED],
  ) {
    super(message, ERROR_CODES.RATE_LIMIT_EXCEEDED, 429, { retryAfter });
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class NetworkError extends NeuranaError {
  constructor(message = ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]) {
    super(message, ERROR_CODES.NETWORK_ERROR);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends NeuranaError {
  constructor(message = ERROR_MESSAGES[ERROR_CODES.TIMEOUT]) {
    super(message, ERROR_CODES.TIMEOUT, 408);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class ConfigurationError extends NeuranaError {
  constructor(message = ERROR_MESSAGES[ERROR_CODES.INVALID_CONFIG]) {
    super(message, ERROR_CODES.INVALID_CONFIG);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export class AnalyzerError extends NeuranaError {
  constructor(message = ERROR_MESSAGES[ERROR_CODES.ANALYZER_ERROR], details?: unknown) {
    super(message, ERROR_CODES.ANALYZER_ERROR, undefined, details);
    this.name = 'AnalyzerError';
    Object.setPrototypeOf(this, AnalyzerError.prototype);
  }
}

export class AiGenerationError extends NeuranaError {
  constructor(message = ERROR_MESSAGES[ERROR_CODES.AI_GENERATION_ERROR], details?: unknown) {
    super(message, ERROR_CODES.AI_GENERATION_ERROR, undefined, details);
    this.name = 'AiGenerationError';
    Object.setPrototypeOf(this, AiGenerationError.prototype);
  }
}
