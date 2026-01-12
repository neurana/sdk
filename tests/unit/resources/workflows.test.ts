import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { NeuranaClient } from "../../../src/client.js";
import { MockServer, FIXTURES, assertRejects } from "../../helpers/index.js";

describe("WorkflowsResource", () => {
  let client: NeuranaClient;
  let server: MockServer;

  beforeEach(async () => {
    server = new MockServer();
    await server.start();
    client = new NeuranaClient({
      apiKey: "test-key-12345",
      baseUrl: server.url,
    });
  });

  afterEach(async () => {
    await server.stop();
  });

  describe("list", () => {
    it("returns paginated workflows", async () => {
      server.onGet("/workflows", (_req, res) => {
        // Real API returns {workflows: [], count} format
        server.respondJson(res, {
          success: true,
          workflows: FIXTURES.WORKFLOW.LIST,
          count: 2,
        });
      });

      const result = await client.workflows.list();

      assert.equal(result.data.length, 2);
      assert.equal(result.pagination.total, 2);
    });

    it("passes query parameters", async () => {
      server.onGet("/workflows", (req, res) => {
        const url = new URL(req.url ?? "", server.url);
        assert.equal(url.searchParams.get("limit"), "10");
        assert.equal(url.searchParams.get("offset"), "5");
        // Real API returns {workflows: [], count} format
        server.respondJson(res, {
          success: true,
          workflows: [],
          count: 0,
        });
      });

      await client.workflows.list({ limit: 10, offset: 5 });
    });
  });

  describe("create", () => {
    it("creates workflow with valid data", async () => {
      server.onPost("/workflows", async (req, res) => {
        const body = await server.parseBody<{ name: string }>(req);
        server.respondJson(
          res,
          { ...FIXTURES.WORKFLOW.VALID, name: body.name },
          201
        );
      });

      const result = await client.workflows.create({
        name: "New Workflow",
        steps: [{ type: "http", config: { url: "https://api.example.com" } }],
      });

      assert.equal(result.name, "New Workflow");
      assert.ok(result.id);
    });

    it("requires at least one step", async () => {
      await assert.rejects(
        () => client.workflows.create({ name: "Test", steps: [] }),
        { message: /At least one step is required/ }
      );
    });

    it("creates workflow with code step - uploads code automatically", async () => {
      server.onPost("/upload-code", async (_req, res) => {
        server.respondJson(
          res,
          { key: "code-file-uuid-123", fileName: "step_1.py" },
          201
        );
      });

      server.onPost("/workflows", async (req, res) => {
        const body = await server.parseBody<{
          steps: Array<{ config: { fileId: string } }>;
        }>(req);
        assert.equal(body.steps[0].config.fileId, "code-file-uuid-123");
        assert.ok(!("code" in body.steps[0].config));
        server.respondJson(
          res,
          { ...FIXTURES.WORKFLOW.VALID, steps: body.steps },
          201
        );
      });

      const result = await client.workflows.create({
        name: "Code Workflow",
        steps: [
          {
            type: "code",
            name: "Process Data",
            config: {
              runtime: "python",
              code: 'print("Hello World")',
              libs: ["requests"],
            },
          },
        ],
      });

      assert.ok(result.id);
    });

    it("validates code step has runtime", async () => {
      await assert.rejects(
        () =>
          client.workflows.create({
            name: "Test",
            steps: [
              {
                type: "code",
                config: { code: 'print("test")' } as any,
              },
            ],
          }),
        { message: /runtime is required/ }
      );
    });

    it("validates code step has code content", async () => {
      await assert.rejects(
        () =>
          client.workflows.create({
            name: "Test",
            steps: [
              {
                type: "code",
                config: { runtime: "python", code: "" },
              },
            ],
          }),
        { message: /code content is required/ }
      );
    });

    it("returns workflowUrl when sdkBaseUrl is configured", async () => {
      const clientWithSdkUrl = new NeuranaClient({
        apiKey: "test-key-12345",
        baseUrl: server.url,
        sdkBaseUrl: "https://api.neurana.io",
      });

      server.onPost("/workflows", async (req, res) => {
        const body = await server.parseBody<{ name: string }>(req);
        server.respondJson(
          res,
          {
            ...FIXTURES.WORKFLOW.VALID,
            name: body.name,
            tenantId: "user_12345",
            workflowKey: "lead-to-appointment",
          },
          201
        );
      });

      const result = await clientWithSdkUrl.workflows.create({
        name: "Lead to Appointment",
        steps: [{ type: "http", config: { url: "https://api.example.com" } }],
      });

      assert.equal(
        result.workflowUrl,
        "https://api.neurana.io/sdk/user_12345/lead-to-appointment"
      );
    });
  });

  describe("get", () => {
    it("returns workflow by id", async () => {
      server.onGet("/workflows/:id", (_req, res) => {
        server.respondJson(res, FIXTURES.WORKFLOW.VALID);
      });

      const result = await client.workflows.get("wf_123");

      assert.equal(result.id, "wf_123");
      assert.equal(result.name, "Test Workflow");
    });

    it("throws NotFoundError for invalid id", async () => {
      server.onGet("/workflows/:id", (_req, res) => {
        server.respondError(res, "NOT_FOUND", "Workflow not found", 404);
      });

      await assertRejects(() => client.workflows.get("invalid"), "NOT_FOUND");
    });
  });

  describe("update", () => {
    it("updates workflow with partial data", async () => {
      server.onPatch("/workflows/:id", async (req, res) => {
        const body = await server.parseBody<{ name: string }>(req);
        server.respondJson(res, {
          ...FIXTURES.WORKFLOW.VALID,
          name: body.name,
        });
      });

      const result = await client.workflows.update("wf_123", {
        name: "Updated Name",
      });

      assert.equal(result.name, "Updated Name");
    });
  });

  describe("delete", () => {
    it("deletes workflow", async () => {
      server.onDelete("/workflows/:id", (_req, res) => {
        res.writeHead(204);
        res.end();
      });

      await client.workflows.delete("wf_123");
    });
  });

  describe("trigger", () => {
    it("triggers workflow execution", async () => {
      server.onPost("/trigger", async (req, res) => {
        const body = await server.parseBody<{
          workflowKey: string;
          trigger: { type: string };
          data?: unknown;
        }>(req);
        server.respondJson(res, {
          success: true,
          executionId: "exec_123",
          tenantId: "user_123",
          workflowKey: body.workflowKey,
          workflowVersion: 1,
          checkStatusUrl: "/execution/exec_123",
        });
      });

      const result = await client.workflows.trigger("wf_123", { data: "test" });

      assert.equal(result.success, true);
      assert.equal(result.executionId, "exec_123");
      assert.equal(result.workflowKey, "wf_123");
    });

    it("triggers workflow without input", async () => {
      server.onPost("/trigger", async (req, res) => {
        const body = await server.parseBody<{ workflowKey: string }>(req);
        server.respondJson(res, {
          success: true,
          executionId: "exec_456",
          tenantId: "user_123",
          workflowKey: body.workflowKey,
          workflowVersion: 1,
          checkStatusUrl: "/execution/exec_456",
        });
      });

      const result = await client.workflows.trigger("my-workflow");

      assert.equal(result.success, true);
      assert.equal(result.executionId, "exec_456");
    });

    it("validates workflowKey format", async () => {
      await assert.rejects(() => client.workflows.trigger(""), {
        message: /workflowKey is required/,
      });

      await assert.rejects(() => client.workflows.trigger("invalid key!"), {
        message: /Invalid workflowKey format/,
      });
    });
  });

  describe("updateVisibility", () => {
    it("updates workflow visibility", async () => {
      server.onPatch("/workflows/:id/visibility", async (req, res) => {
        const body = await server.parseBody<{ visibility: string }>(req);
        server.respondJson(res, {
          ...FIXTURES.WORKFLOW.VALID,
          visibility: body.visibility,
        });
      });

      const result = await client.workflows.updateVisibility("wf_123", {
        visibility: "public",
      });

      assert.equal(result.visibility, "public");
    });
  });
});
