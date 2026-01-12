import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { NeuranaClient } from "../../../src/client.js";
import { MockServer } from "../../helpers/index.js";

describe("ApiKeysResource", () => {
  let client: NeuranaClient;
  let server: MockServer;

  beforeEach(async () => {
    server = new MockServer();
    await server.start();
    client = new NeuranaClient({
      apiKey: "test-key-12345",
      baseUrl: server.url,
      mainApiUrl: server.url,
    });
  });

  afterEach(async () => {
    await server.stop();
  });

  describe("list", () => {
    it("returns paginated api keys", async () => {
      server.onGet("/api-keys", (_req, res) => {
        server.respondJson(res, {
          data: [
            {
              id: "key_123",
              name: "Production API Key",
              keyPrefix: "nrn_prod_",
              permissions: ["workflows:read", "workflows:trigger"],
              status: "active",
              createdAt: "2024-01-01T00:00:00Z",
              expiresAt: null,
              lastUsedAt: "2024-01-15T12:00:00Z",
              lastUsedIp: "192.168.1.1",
              usageCount: 150,
              rateLimit: 1000,
              allowedIps: null,
              allowedOrigins: null,
              metadata: null,
            },
          ],
          pagination: { total: 1, limit: 20, offset: 0 },
        });
      });

      const result = await client.apiKeys.list();

      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].id, "key_123");
      assert.equal(result.data[0].status, "active");
    });
  });

  describe("create", () => {
    it("creates api key with permissions", async () => {
      server.onPost("/api-keys", (_req, res) => {
        server.respondJson(res, {
          apiKey: {
            id: "key_new",
            name: "New API Key",
            key: "nrn_prod_xxxxxxxxxxxxxxxxxxxxxxxx",
            keyPrefix: "nrn_prod_",
            permissions: ["workflows:read", "workflows:trigger"],
            status: "active",
            createdAt: "2024-01-20T00:00:00Z",
            expiresAt: "2025-01-20T00:00:00Z",
            lastUsedAt: null,
            lastUsedIp: null,
            usageCount: 0,
            rateLimit: 500,
            allowedIps: ["10.0.0.0/8"],
            allowedOrigins: ["https://myapp.com"],
            metadata: { env: "production" },
          },
          warning: "Store this key securely. It will not be shown again.",
        });
      });

      const result = await client.apiKeys.create({
        name: "New API Key",
        permissions: ["workflows:read", "workflows:trigger"],
        expiresInDays: 365,
        rateLimit: 500,
        allowedIps: ["10.0.0.0/8"],
        allowedOrigins: ["https://myapp.com"],
        metadata: { env: "production" },
      });

      assert.equal(result.apiKey.id, "key_new");
      assert.ok(result.apiKey.key.startsWith("nrn_prod_"));
      assert.ok(result.warning.includes("securely"));
    });
  });

  describe("get", () => {
    it("returns api key details", async () => {
      server.onGet("/api-keys/:id", (_req, res) => {
        server.respondJson(res, {
          id: "key_123",
          name: "Production Key",
          keyPrefix: "nrn_prod_",
          permissions: ["workflows:read"],
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          expiresAt: null,
          lastUsedAt: null,
          lastUsedIp: null,
          usageCount: 0,
          rateLimit: 1000,
          allowedIps: null,
          allowedOrigins: null,
          metadata: null,
        });
      });

      const result = await client.apiKeys.get("key_123");

      assert.equal(result.id, "key_123");
      assert.deepEqual(result.permissions, ["workflows:read"]);
    });
  });

  describe("update", () => {
    it("updates api key permissions", async () => {
      server.onPatch("/api-keys/:id", (_req, res) => {
        server.respondJson(res, {
          id: "key_123",
          name: "Updated Key",
          keyPrefix: "nrn_prod_",
          permissions: ["workflows:read", "workflows:write"],
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          expiresAt: null,
          lastUsedAt: null,
          lastUsedIp: null,
          usageCount: 0,
          rateLimit: 2000,
          allowedIps: null,
          allowedOrigins: null,
          metadata: null,
        });
      });

      const result = await client.apiKeys.update("key_123", {
        name: "Updated Key",
        permissions: ["workflows:read", "workflows:write"],
        rateLimit: 2000,
      });

      assert.equal(result.name, "Updated Key");
      assert.equal(result.rateLimit, 2000);
    });
  });

  describe("delete", () => {
    it("deletes api key", async () => {
      server.onDelete("/api-keys/:id", (_req, res) => {
        res.writeHead(204);
        res.end();
      });

      await client.apiKeys.delete("key_123");
    });
  });

  describe("rotate", () => {
    it("rotates api key", async () => {
      server.onPost("/api-keys/:id/rotate", (_req, res) => {
        server.respondJson(res, {
          apiKey: {
            id: "key_123",
            name: "Production Key",
            key: "nrn_prod_yyyyyyyyyyyyyyyyyyyyyyyy",
            keyPrefix: "nrn_prod_",
            permissions: ["workflows:read"],
            status: "active",
            createdAt: "2024-01-20T00:00:00Z",
            expiresAt: "2025-01-20T00:00:00Z",
            lastUsedAt: null,
            lastUsedIp: null,
            usageCount: 0,
            rateLimit: 1000,
            allowedIps: null,
            allowedOrigins: null,
            metadata: null,
          },
          previousKeyValidUntil: "2024-01-21T00:00:00Z",
          warning: "Previous key will be valid for 24 hours.",
        });
      });

      const result = await client.apiKeys.rotate("key_123", {
        expiresInDays: 365,
      });

      assert.ok(result.apiKey.key.includes("yyyy"));
      assert.ok(result.previousKeyValidUntil);
    });
  });

  describe("revoke", () => {
    it("revokes api key", async () => {
      server.onPost("/api-keys/:id/revoke", (_req, res) => {
        res.writeHead(204);
        res.end();
      });

      await client.apiKeys.revoke("key_123");
    });
  });

  describe("getUsage", () => {
    it("returns usage stats", async () => {
      server.onGet("/api-keys/:id/usage", (_req, res) => {
        server.respondJson(res, {
          keyId: "key_123",
          totalRequests: 1500,
          successfulRequests: 1450,
          failedRequests: 50,
          lastHourRequests: 25,
          last24HoursRequests: 300,
          topEndpoints: [
            { endpoint: "/workflows/trigger", count: 800 },
            { endpoint: "/workflows", count: 500 },
          ],
          period: {
            start: "2024-01-01T00:00:00Z",
            end: "2024-01-20T00:00:00Z",
          },
        });
      });

      const result = await client.apiKeys.getUsage("key_123");

      assert.equal(result.totalRequests, 1500);
      assert.equal(result.topEndpoints.length, 2);
    });
  });

  describe("validate", () => {
    it("validates active api key", async () => {
      server.onPost("/api-keys/validate", (_req, res) => {
        server.respondJson(res, {
          valid: true,
          keyId: "key_123",
          permissions: ["workflows:read", "workflows:trigger"],
          rateLimitRemaining: 950,
          error: null,
        });
      });

      const result = await client.apiKeys.validate("nrn_prod_xxxxxxxx");

      assert.equal(result.valid, true);
      assert.equal(result.keyId, "key_123");
      assert.ok(result.rateLimitRemaining);
    });

    it("rejects invalid api key", async () => {
      server.onPost("/api-keys/validate", (_req, res) => {
        server.respondJson(res, {
          valid: false,
          keyId: null,
          permissions: null,
          rateLimitRemaining: null,
          error: "Invalid or revoked API key",
        });
      });

      const result = await client.apiKeys.validate("invalid_key");

      assert.equal(result.valid, false);
      assert.ok(result.error);
    });
  });
});
