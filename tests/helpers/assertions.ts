import { strict as assert } from 'node:assert';
import { NeuranaError } from '../../src/errors.js';

export function assertNeuranaError(
  error: unknown,
  expectedCode: string,
  expectedStatus?: number,
): asserts error is NeuranaError {
  assert.ok(error instanceof Error, 'Expected error to be an Error instance');
  assert.ok(error instanceof NeuranaError, 'Expected error to be a NeuranaError');
  assert.equal((error as NeuranaError).code, expectedCode);
  if (expectedStatus !== undefined) {
    assert.equal((error as NeuranaError).statusCode, expectedStatus);
  }
}

export function assertHasProperty<T, K extends string>(
  obj: T,
  key: K,
): asserts obj is T & Record<K, unknown> {
  assert.ok(
    obj !== null && typeof obj === 'object' && key in obj,
    `Expected object to have property "${key}"`,
  );
}

export async function assertRejects(
  fn: () => Promise<unknown>,
  errorCode?: string,
): Promise<void> {
  let threw = false;
  try {
    await fn();
  } catch (error) {
    threw = true;
    if (errorCode) {
      assertNeuranaError(error, errorCode);
    }
  }
  assert.ok(threw, 'Expected function to throw');
}

export async function assertResolves<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    assert.fail(`Expected function not to throw, but threw: ${error}`);
  }
}
