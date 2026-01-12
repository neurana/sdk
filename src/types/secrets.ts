export interface Secret {
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecretWithValue extends Secret {
  value: string;
}

export interface CreateSecretRequest {
  name: string;
  value: string;
}

export interface UpdateSecretRequest {
  value: string;
}

export interface ListSecretsParams {
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}
