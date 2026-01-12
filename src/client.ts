import { HttpClient } from "./http.js";
import { ConfigurationError } from "./errors.js";
import { BASE_URL, MAIN_API_URL, VALIDATION } from "./constants/index.js";
import { logger } from "./logger.js";
import {
  WorkflowsResource,
  CodeResource,
  SecretsResource,
  ApiKeysResource,
  ExecutionResource,
} from "./resources/index.js";

export interface NeuranaConfig {
  apiKey: string;
  baseUrl?: string;
  mainApiUrl?: string;
  sdkBaseUrl?: string;
  timeout?: number;
  allowInsecureHttp?: boolean;
}

export class NeuranaClient {
  readonly workflows: WorkflowsResource;
  readonly code: CodeResource;
  readonly secrets: SecretsResource;
  readonly apiKeys: ApiKeysResource;
  readonly executions: ExecutionResource;

  constructor(config: NeuranaConfig) {
    this.validateConfig(config);

    const workflowsHttp = new HttpClient({
      baseUrl: config.baseUrl ?? BASE_URL,
      apiKey: config.apiKey,
      timeout: config.timeout,
    });

    const mainHttp = new HttpClient({
      baseUrl: config.mainApiUrl ?? MAIN_API_URL,
      apiKey: config.apiKey,
      timeout: config.timeout,
    });

    this.code = new CodeResource(workflowsHttp);
    this.secrets = new SecretsResource(mainHttp);
    this.apiKeys = new ApiKeysResource(mainHttp);
    this.executions = new ExecutionResource(workflowsHttp);

    this.workflows = new WorkflowsResource(
      workflowsHttp,
      async (fileName, content, language) => {
        const result = await this.code.upload({ fileName, content, language });
        return { key: result.key };
      },
      config.sdkBaseUrl
    );
  }

  private validateConfig(config: NeuranaConfig): void {
    if (!config.apiKey) {
      throw new ConfigurationError("API key is required");
    }

    if (typeof config.apiKey !== "string") {
      throw new ConfigurationError("API key must be a string");
    }

    const key = config.apiKey.trim();
    if (key.length < VALIDATION.MIN_API_KEY_LENGTH) {
      throw new ConfigurationError("Invalid API key format");
    }

    if (key.length > VALIDATION.MAX_API_KEY_LENGTH) {
      throw new ConfigurationError("API key exceeds maximum length");
    }

    if (key.startsWith("nrn_") && !VALIDATION.API_KEY_PATTERN.test(key)) {
      throw new ConfigurationError("Invalid API key format");
    }

    this.validateEndpointSecurity(config.baseUrl, config.allowInsecureHttp);
    this.validateEndpointSecurity(config.mainApiUrl, config.allowInsecureHttp);
    this.validateEndpointSecurity(config.sdkBaseUrl, config.allowInsecureHttp);
  }

  private validateEndpointSecurity(url: string | undefined, allowInsecure?: boolean): void {
    if (!url) return;
    
    const isSecure = url.startsWith("https://");
    const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");
    
    if (!isSecure && !isLocalhost) {
      if (allowInsecure) {
        logger.warn("Using insecure HTTP connection", { url: url.split("?")[0] }, "security");
      } else {
        throw new ConfigurationError("HTTPS is required for non-localhost endpoints");
      }
    }
  }
}
