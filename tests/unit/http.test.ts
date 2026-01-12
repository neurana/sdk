import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { HttpClient } from '../../src/http.js';
import { MockServer, FIXTURES, assertRejects } from '../helpers/index.js';
import { AuthenticationError, NotFoundError, RateLimitError } from '../../src/errors.js';

describe('HttpClient', () => {
  let server: MockServer;
  let client: HttpClient;

  beforeEach(async () => {
    server = new MockServer();
    await server.start();
    client = new HttpClient({
      baseUrl: server.url,
      apiKey: 'test-api-key-12345',
    });
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('get', () => {
    it('makes GET request', async () => {
      server.onGet('/test', (_req, res) => {
        server.respondJson(res, { success: true });
      });

      const result = await client.get<{ success: boolean }>('/test');

      assert.deepEqual(result, { success: true });
    });

    it('includes query parameters', async () => {
      server.onGet('/test', (req, res) => {
        const url = new URL(req.url ?? '', server.url);
        server.respondJson(res, {
          limit: url.searchParams.get('limit'),
          offset: url.searchParams.get('offset'),
        });
      });

      const result = await client.get<{ limit: string; offset: string }>('/test', {
        limit: 10,
        offset: 5,
      });

      assert.equal(result.limit, '10');
      assert.equal(result.offset, '5');
    });

    it('skips undefined parameters', async () => {
      server.onGet('/test', (req, res) => {
        const url = new URL(req.url ?? '', server.url);
        server.respondJson(res, {
          hasUndefined: url.searchParams.has('undefined'),
        });
      });

      const result = await client.get<{ hasUndefined: boolean }>('/test', {
        defined: 'yes',
        undefined: undefined,
      });

      assert.equal(result.hasUndefined, false);
    });
  });

  describe('post', () => {
    it('makes POST request with body', async () => {
      server.onPost('/test', async (req, res) => {
        const body = await server.parseBody<{ name: string }>(req);
        server.respondJson(res, { received: body.name }, 201);
      });

      const result = await client.post<{ received: string }>('/test', { name: 'test' });

      assert.equal(result.received, 'test');
    });
  });

  describe('patch', () => {
    it('makes PATCH request', async () => {
      server.onPatch('/test/:id', async (req, res) => {
        const body = await server.parseBody<{ name: string }>(req);
        server.respondJson(res, { ...FIXTURES.WORKFLOW.VALID, name: body.name });
      });

      const result = await client.patch<{ name: string }>('/test/123', { name: 'updated' });

      assert.equal(result.name, 'updated');
    });
  });

  describe('delete', () => {
    it('makes DELETE request', async () => {
      server.onDelete('/test/:id', (_req, res) => {
        res.writeHead(204);
        res.end();
      });

      const result = await client.delete('/test/123');

      assert.equal(result, undefined);
    });
  });

  describe('error handling', () => {
    it('throws AuthenticationError on 401', async () => {
      server.onGet('/test', (_req, res) => {
        server.respondError(res, 'AUTH_FAILED', 'Invalid token', 401);
      });

      try {
        await client.get('/test');
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error instanceof AuthenticationError);
      }
    });

    it('throws NotFoundError on 404', async () => {
      server.onGet('/test', (_req, res) => {
        server.respondError(res, 'NOT_FOUND', 'Not found', 404);
      });

      try {
        await client.get('/test');
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
      }
    });

    it('throws RateLimitError on 429', async () => {
      server.onGet('/test', (_req, res) => {
        server.respondError(res, 'RATE_LIMIT', 'Too many requests', 429);
      });

      try {
        await client.get('/test');
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error instanceof RateLimitError);
      }
    });
  });

  describe('headers', () => {
    it('includes authorization header', async () => {
      let authHeader: string | undefined;

      server.onGet('/test', (req, res) => {
        authHeader = req.headers.authorization;
        server.respondJson(res, {});
      });

      await client.get('/test');

      assert.equal(authHeader, 'Bearer test-api-key-12345');
    });

    it('includes content-type header', async () => {
      let contentType: string | undefined;

      server.onPost('/test', (req, res) => {
        contentType = req.headers['content-type'];
        server.respondJson(res, {});
      });

      await client.post('/test', { data: 'test' });

      assert.equal(contentType, 'application/json');
    });
  });
});
