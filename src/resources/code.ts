import type { HttpClient } from "../http.js";
import { ENDPOINTS, SIZE_LIMITS } from "../constants/index.js";
import { ValidationError } from "../errors.js";
import { logger } from "../logger.js";
import {
  validateFileName,
  validateFileKey,
  validateFileSize,
  getContentSize,
  getLanguage,
  isAllowedExtension,
} from "../utils/index.js";
import type {
  PaginatedResponse,
  CodeFile,
  CodeFileWithContent,
  UploadCodeRequest,
  UploadCodeResponse,
  ListCodeParams,
  CodeHistoryEntry,
  CodeHistoryParams,
} from "../types/index.js";

export class CodeResource {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  async list(params?: ListCodeParams): Promise<PaginatedResponse<CodeFile>> {
    const response = await this.#http.get<{
      files: CodeFile[];
      count: number;
      hasMore: boolean;
      continuationToken?: string;
    }>(ENDPOINTS.CODE.LIST, params);
    return {
      data: response.files || [],
      pagination: {
        total: response.count || 0,
        hasMore: response.hasMore || false,
        nextToken: response.continuationToken,
      },
    };
  }

  async upload(data: UploadCodeRequest): Promise<UploadCodeResponse> {
    const fileName = validateFileName(data?.fileName);

    if (!isAllowedExtension(fileName)) {
      throw new ValidationError("File extension not allowed for code uploads");
    }

    if (!data?.content) {
      throw new ValidationError("content is required");
    }

    const contentSize = getContentSize(data.content);
    validateFileSize(contentSize, SIZE_LIMITS.MAX_CODE_SIZE);

    const language = data.language ?? getLanguage(fileName);

    logger.debug(
      "Uploading code file",
      { fileName, language, size: contentSize },
      "code"
    );

    return this.#http.post<UploadCodeResponse>(ENDPOINTS.CODE.UPLOAD, {
      fileName,
      content: data.content,
      language,
    });
  }

  async get(key: string): Promise<CodeFileWithContent> {
    const validKey = validateFileKey(key);
    return this.#http.get<CodeFileWithContent>(ENDPOINTS.CODE.GET(validKey));
  }

  async delete(key: string): Promise<void> {
    const validKey = validateFileKey(key);
    logger.debug("Deleting code file", { key: validKey }, "code");
    return this.#http.delete(ENDPOINTS.CODE.DELETE(validKey));
  }

  async listHistory(
    params?: CodeHistoryParams
  ): Promise<PaginatedResponse<CodeHistoryEntry>> {
    return this.#http.get<PaginatedResponse<CodeHistoryEntry>>(
      ENDPOINTS.CODE.HISTORY,
      params
    );
  }

  async getHistoryByKey(
    key: string,
    params?: CodeHistoryParams
  ): Promise<PaginatedResponse<CodeHistoryEntry>> {
    const validKey = validateFileKey(key);
    return this.#http.get<PaginatedResponse<CodeHistoryEntry>>(
      ENDPOINTS.CODE.HISTORY_BY_KEY(validKey),
      params
    );
  }
}
