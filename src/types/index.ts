export interface ModelInfo {
  id: string;
  name?: string;
  ownedBy?: string;
  contextWindow?: number;
}

export interface CapturedExchange {
  id: string;
  timestamp: number;
  providerId?: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    durationMs: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  statusCode: number;
  durationMs: number;
  models: ModelInfo[];
  error?: {
    code: string;
    message: string;
  };
  exchange: CapturedExchange;
}

export interface ProviderDefinition {
  id: string;
  displayName: string;
  baseUrl: string;
  keyPrefixes: string[];
  docUrl?: string;
  isCustom?: boolean;
  authHeaderName?: string;
  requiresOptionalPermission?: boolean;
}

export interface SavedKey {
  id: string;
  nickname: string;
  providerId: string;
  maskedKey: string;
  encryptedKey: string; // Base64 encoded
  iv: string; // Base64 encoded IV
  createdAt: number;
  lastCheckedAt?: number;
  status?: 'valid' | 'invalid' | 'ratelimited' | 'error';
  modelsCount?: number;
}

export interface CustomProvider {
  id: string;
  label: string;
  baseUrl: string;
  validateMethod: 'GET' | 'POST';
  validatePath: string;
  headers: Record<string, string>;
  authHeaderName?: string;
  modelsResponsePath?: string;
}

export interface HeaderRow {
  key: string;
  value: string;
}

export interface CustomRequestState {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: HeaderRow[];
  body: string;
}
