import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { NeuranaClient } from "../../../src/client.js";
import { MockServer, FIXTURES } from "../../helpers/index.js";

describe("SecretsResource", () => {
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
    it("returns paginated secrets", async () => {
      server.onGet("/secrets", (_req, res) => {
        // Real API returns {items: []} format
        server.respondJson(res, {
          items: [FIXTURES.SECRET.VALID],
        });
      });

      const result = await client.secrets.list();

      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].name, "API_KEY");
    });
  });

  describe("create", () => {
    it("creates secret", async () => {
      server.onPost("/secrets", async (req, res) => {
        const body = await server.parseBody<{ name: string; value: string }>(
          req
        );
        server.respondJson(
          res,
          {
            name: body.name,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
          201
        );
      });

      const result = await client.secrets.create({
        name: "NEW_SECRET",
        value: "secret-value",
      });

      assert.equal(result.name, "NEW_SECRET");
    });
  });

  describe("get", () => {
    it("returns secret with value", async () => {
      server.onGet("/secrets/:name", (_req, res) => {
        server.respondJson(res, {
          ...FIXTURES.SECRET.VALID,
          value: "secret-value-123",
        });
      });

      const result = await client.secrets.get("API_KEY");

      assert.equal(result.name, "API_KEY");
      assert.equal(result.value, "secret-value-123");
    });
  });

  describe("update", () => {
    it("updates secret value", async () => {
      server.onPatch("/secrets/:name", (_req, res) => {
        server.respondJson(res, {
          ...FIXTURES.SECRET.VALID,
          updatedAt: "2026-01-02T00:00:00Z",
        });
      });

      const result = await client.secrets.update("API_KEY", {
        value: "new-value",
      });

      assert.equal(result.name, "API_KEY");
    });
  });

  describe("delete", () => {
    it("deletes secret", async () => {
      server.onDelete("/secrets/:name", (_req, res) => {
        res.writeHead(204);
        res.end();
      });

      await client.secrets.delete("API_KEY");
    });
  });
});
