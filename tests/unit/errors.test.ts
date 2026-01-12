import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  NeuranaError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  ConfigurationError,
  AnalyzerError,
  AiGenerationError,
} from '../../src/errors.js';
import { ERROR_CODES } from '../../src/constants/index.js';

describe('Errors', () => {
  describe('NeuranaError', () => {
    it('creates error with all properties', () => {
      const error = new NeuranaError('Test message', 'TEST_CODE', 400, { field: 'name' });

      assert.equal(error.message, 'Test message');
      assert.equal(error.code, 'TEST_CODE');
      assert.equal(error.statusCode, 400);
      assert.deepEqual(error.details, { field: 'name' });
      assert.equal(error.name, 'NeuranaError');
    });

    it('creates from code', () => {
      const error = NeuranaError.fromCode(ERROR_CODES.NOT_FOUND, 404);

      assert.equal(error.code, 'NOT_FOUND');
      assert.equal(error.statusCode, 404);
      assert.ok(error.message.includes('not found'));
    });

    it('serializes to JSON', () => {
      const error = new NeuranaError('Test', 'CODE', 500);
      const json = error.toJSON();

      assert.equal(json.name, 'NeuranaError');
      assert.equal(json.message, 'Test');
      assert.equal(json.code, 'CODE');
    });
  });

  describe('AuthenticationError', () => {
    it('has correct defaults', () => {
      const error = new AuthenticationError();

      assert.equal(error.code, 'AUTH_FAILED');
      assert.equal(error.statusCode, 401);
      assert.equal(error.name, 'AuthenticationError');
    });
  });

  describe('AuthorizationError', () => {
    it('has correct defaults', () => {
      const error = new AuthorizationError();

      assert.equal(error.code, 'FORBIDDEN');
      assert.equal(error.statusCode, 403);
      assert.equal(error.name, 'AuthorizationError');
    });
  });

  describe('NotFoundError', () => {
    it('has correct defaults', () => {
      const error = new NotFoundError();

      assert.equal(error.code, 'NOT_FOUND');
      assert.equal(error.statusCode, 404);
    });
  });

  describe('ValidationError', () => {
    it('has correct defaults', () => {
      const error = new ValidationError('Name is required', { field: 'name' });

      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.equal(error.statusCode, 422);
      assert.deepEqual(error.details, { field: 'name' });
    });
  });

  describe('RateLimitError', () => {
    it('includes retry after', () => {
      const error = new RateLimitError(60);

      assert.equal(error.code, 'RATE_LIMIT');
      assert.equal(error.statusCode, 429);
      assert.equal(error.retryAfter, 60);
    });
  });

  describe('NetworkError', () => {
    it('has correct defaults', () => {
      const error = new NetworkError();

      assert.equal(error.code, 'NETWORK_ERROR');
      assert.equal(error.statusCode, undefined);
    });
  });

  describe('TimeoutError', () => {
    it('has correct defaults', () => {
      const error = new TimeoutError();

      assert.equal(error.code, 'TIMEOUT');
      assert.equal(error.statusCode, 408);
    });
  });

  describe('ConfigurationError', () => {
    it('has correct defaults', () => {
      const error = new ConfigurationError();

      assert.equal(error.code, 'INVALID_CONFIG');
    });
  });

  describe('AnalyzerError', () => {
    it('has correct defaults', () => {
      const error = new AnalyzerError('Failed to scan', { path: '/test' });

      assert.equal(error.code, 'ANALYZER_ERROR');
      assert.deepEqual(error.details, { path: '/test' });
    });
  });

  describe('AiGenerationError', () => {
    it('has correct defaults', () => {
      const error = new AiGenerationError();

      assert.equal(error.code, 'AI_GENERATION_ERROR');
    });
  });

  describe('instanceof checks', () => {
    it('maintains prototype chain', () => {
      const authError = new AuthenticationError();
      const validationError = new ValidationError();

      assert.ok(authError instanceof NeuranaError);
      assert.ok(authError instanceof AuthenticationError);
      assert.ok(authError instanceof Error);

      assert.ok(validationError instanceof NeuranaError);
      assert.ok(validationError instanceof ValidationError);
    });
  });
});
