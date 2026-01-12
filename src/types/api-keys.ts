export type ApiKeyPermission = 
  | 'workflows:read'
  | 'workflows:write'
  | 'workflows:trigger'
  | 'workflows:delete'
  | 'memories:read'
  | 'memories:write'
  | 'files:read'
  | 'files:write'
  | 'code:read'
  | 'code:write'
  | 'secrets:read'
  | 'runs:read'
  | 'billing:read';

export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: ApiKeyPermission[];
  status: ApiKeyStatus;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  usageCount: number;
  rateLimit: number;
  allowedIps: string[] | null;
  allowedOrigins: string[] | null;
  metadata: Record<string, string> | null;
}

export interface ApiKeyWithSecret extends ApiKey {
  key: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: ApiKeyPermission[];
  expiresInDays?: number;
  rateLimit?: number;
  allowedIps?: string[];
  allowedOrigins?: string[];
  metadata?: Record<string, string>;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKeyWithSecret;
  warning: string;
}

export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: ApiKeyPermission[];
  rateLimit?: number;
  allowedIps?: string[] | null;
  allowedOrigins?: string[] | null;
  metadata?: Record<string, string> | null;
}

export interface RotateApiKeyRequest {
  expiresInDays?: number;
}

export interface RotateApiKeyResponse {
  apiKey: ApiKeyWithSecret;
  previousKeyValidUntil: string;
  warning: string;
}

export interface ListApiKeysParams {
  limit?: number;
  offset?: number;
  status?: ApiKeyStatus;
  [key: string]: string | number | boolean | undefined;
}

export interface ApiKeyUsageStats {
  keyId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastHourRequests: number;
  last24HoursRequests: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface ValidateApiKeyResponse {
  valid: boolean;
  keyId: string | null;
  permissions: ApiKeyPermission[] | null;
  rateLimitRemaining: number | null;
  reason: 'invalid_key' | 'revoked' | 'expired' | null;
  error: string | null;
}
