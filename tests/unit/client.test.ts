import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { NeuranaClient } from '../../src/client.js';

describe('NeuranaClient', () => {
  describe('constructor', () => {
    it('creates instance with valid config', () => {
      const client = new NeuranaClient({ apiKey: 'test-key-12345' });

      assert.ok(client.workflows);
      assert.ok(client.code);
      assert.ok(client.secrets);
      assert.ok(client.apiKeys);
      assert.ok(client.executions);
    });

    it('throws with missing API key', () => {
      assert.throws(
        () => new NeuranaClient({ apiKey: '' }),
        { message: /API key is required/ },
      );
    });

    it('throws with invalid API key type', () => {
      assert.throws(
        () => new NeuranaClient({ apiKey: 123 as unknown as string }),
        { message: /API key must be a string/ },
      );
    });

    it('throws with API key too short', () => {
      assert.throws(
        () => new NeuranaClient({ apiKey: 'short' }),
        { message: /Invalid API key format/ },
      );
    });

    it('throws with invalid nrn_ prefix format', () => {
      assert.throws(
        () => new NeuranaClient({ apiKey: 'nrn_@invalid!' }),
        { message: /Invalid API key format/ },
      );
    });

    it('accepts custom base URL', () => {
      const client = new NeuranaClient({
        apiKey: 'test-key-12345',
        baseUrl: 'https://custom.api.com',
      });

      assert.ok(client);
      assert.ok(client.workflows);
    });

    it('all resources require valid API key', () => {
      assert.throws(
        () => new NeuranaClient({ apiKey: '' }),
        { message: /API key is required/ },
      );

      assert.throws(
        () => new NeuranaClient({ apiKey: null as unknown as string }),
        { message: /API key is required/ },
      );

      assert.throws(
        () => new NeuranaClient({ apiKey: undefined as unknown as string }),
        { message: /API key is required/ },
      );
    });
  });
});
