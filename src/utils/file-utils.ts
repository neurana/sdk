import { ValidationError } from '../errors.js';
import { VALIDATION } from '../constants/index.js';

const MIME_TYPES: Record<string, string> = {
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.js': 'application/javascript',
  '.jsx': 'application/javascript',
  '.json': 'application/json',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.py': 'text/x-python',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.css': 'text/css',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.csv': 'text/csv',
  '.sql': 'application/sql',
  '.graphql': 'application/graphql',
  '.prisma': 'text/plain',
};

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.py': 'python',
  '.md': 'markdown',
  '.html': 'html',
  '.css': 'css',
  '.sql': 'sql',
  '.graphql': 'graphql',
};

const SAFE_FILENAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const SAFE_KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;

const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1',
  '.dll', '.so', '.dylib', '.bin',
  '.msi', '.com', '.vbs', '.scr',
]);

const MAX_KEY_LENGTH = 256;
const MAX_FILENAME_LENGTH = 255;

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return '';
  }
  return fileName.slice(lastDot).toLowerCase();
}

export function getMimeType(fileName: string): string {
  const ext = getFileExtension(fileName);
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}

export function getLanguage(fileName: string): string {
  const ext = getFileExtension(fileName);
  return LANGUAGE_MAP[ext] ?? 'plaintext';
}

export function isAllowedExtension(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return VALIDATION.ALLOWED_FILE_EXTENSIONS.includes(ext as typeof VALIDATION.ALLOWED_FILE_EXTENSIONS[number]);
}

export function isDangerousExtension(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return DANGEROUS_EXTENSIONS.has(ext);
}

export function validateFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    throw new ValidationError('fileName is required');
  }

  const trimmed = fileName.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('fileName cannot be empty');
  }

  if (trimmed.length > MAX_FILENAME_LENGTH) {
    throw new ValidationError(`fileName exceeds max length of ${MAX_FILENAME_LENGTH}`);
  }

  if (!SAFE_FILENAME_PATTERN.test(trimmed)) {
    throw new ValidationError('fileName contains invalid characters');
  }

  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    throw new ValidationError('fileName contains path separators');
  }

  if (isDangerousExtension(trimmed)) {
    throw new ValidationError('File type not allowed for security reasons');
  }

  return trimmed;
}

export function validateFileKey(key: string): string {
  if (!key || typeof key !== 'string') {
    throw new ValidationError('key is required');
  }

  const trimmed = key.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('key cannot be empty');
  }

  if (trimmed.length > MAX_KEY_LENGTH) {
    throw new ValidationError(`key exceeds max length of ${MAX_KEY_LENGTH}`);
  }

  if (trimmed.includes('..')) {
    throw new ValidationError('key contains path traversal');
  }

  if (!SAFE_KEY_PATTERN.test(trimmed)) {
    throw new ValidationError('key contains invalid characters');
  }

  return trimmed;
}

export function validateFileSize(size: number, maxSize: number): void {
  if (size <= 0) {
    throw new ValidationError('File content cannot be empty');
  }

  if (size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
    throw new ValidationError(`File size exceeds maximum of ${maxMB}MB`);
  }
}

export function getContentSize(content: Buffer | Uint8Array | string): number {
  if (typeof content === 'string') {
    return Buffer.byteLength(content, 'utf-8');
  }
  return content.length;
}

export function encodeToBase64(content: Buffer | Uint8Array | string): string {
  if (typeof content === 'string') {
    return Buffer.from(content, 'utf-8').toString('base64');
  }
  return Buffer.from(content).toString('base64');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
