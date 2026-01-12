export interface CodeFile {
  key: string;
  fileName: string;
  language: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface CodeFileWithContent extends CodeFile {
  content: string;
  downloadUrl?: string;
}

export interface UploadCodeRequest {
  fileName: string;
  content: string;
  language?: string;
}

export interface UploadCodeResponse {
  key: string;
  fileName: string;
  uploadUrl?: string;
}

export interface ListCodeParams {
  limit?: number;
  offset?: number;
  language?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CodeHistoryEntry {
  version: number;
  key: string;
  fileName: string;
  size: number;
  createdAt: string;
}

export interface CodeHistoryParams {
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}
