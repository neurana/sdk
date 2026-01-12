export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export const HTTP_HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
} as const;

export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  TEXT: 'text/plain',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const TIMEOUTS = {
  DEFAULT: 30_000,
  UPLOAD: 120_000,
  AI_GENERATE: 60_000,
  WEBSOCKET_PING: 30_000,
  WEBSOCKET_RECONNECT: 5_000,
} as const;

export const RETRY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1_000,
  MAX_DELAY: 30_000,
  BACKOFF_FACTOR: 2,
  RETRYABLE_STATUS: [408, 429, 500, 502, 503, 504] as const,
} as const;
