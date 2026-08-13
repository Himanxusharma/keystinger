import { ProviderDefinition, ValidationResult } from '../types';
import { validateOpenAICompatible } from './base';
import { validateAnthropic } from './anthropic';
import { validateGemini } from './gemini';
import { validatePerplexity } from './perplexity';

export const BUILTIN_PROVIDERS: ProviderDefinition[] = [
  {
    id: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    keyPrefixes: ['sk-proj-', 'sk-admin-', 'sk-'],
    docUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'anthropic',
    displayName: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com',
    keyPrefixes: ['sk-ant-'],
    docUrl: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'gemini',
    displayName: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    keyPrefixes: ['AIza'],
    docUrl: 'https://aistudio.google.com/app/apikey'
  },
  {
    id: 'nvidia',
    displayName: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com',
    keyPrefixes: ['nvapi-'],
    docUrl: 'https://build.nvidia.com'
  },
  {
    id: 'mistral',
    displayName: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai',
    keyPrefixes: [],
    docUrl: 'https://console.mistral.ai/api-keys/',
    requiresOptionalPermission: true
  },
  {
    id: 'groq',
    displayName: 'Groq',
    baseUrl: 'https://api.groq.com/openai',
    keyPrefixes: ['gsk_'],
    docUrl: 'https://console.groq.com/keys',
    requiresOptionalPermission: true
  },
  {
    id: 'xai',
    displayName: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai',
    keyPrefixes: ['xai-'],
    docUrl: 'https://console.x.ai',
    requiresOptionalPermission: true
  },
  {
    id: 'cohere',
    displayName: 'Cohere',
    baseUrl: 'https://api.cohere.com',
    keyPrefixes: [],
    docUrl: 'https://dashboard.cohere.com/api-keys',
    requiresOptionalPermission: true
  },
  {
    id: 'perplexity',
    displayName: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai',
    keyPrefixes: ['pplx-'],
    docUrl: 'https://www.perplexity.ai/settings/api',
    requiresOptionalPermission: true
  },
  {
    id: 'deepseek',
    displayName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    keyPrefixes: [],
    docUrl: 'https://platform.deepseek.com/api_keys',
    requiresOptionalPermission: true
  },
  {
    id: 'together',
    displayName: 'Together AI',
    baseUrl: 'https://api.together.xyz',
    keyPrefixes: [],
    docUrl: 'https://api.together.ai/settings/api-keys',
    requiresOptionalPermission: true
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api',
    keyPrefixes: ['sk-or-'],
    docUrl: 'https://openrouter.ai/keys',
    requiresOptionalPermission: true
  }
];

export function autoDetectProviderId(key: string): string | null {
  if (!key) return null;
  const trimmed = key.trim();

  let bestMatchProvider: string | null = null;
  let longestPrefixLength = 0;

  for (const provider of BUILTIN_PROVIDERS) {
    for (const prefix of provider.keyPrefixes) {
      if (prefix && trimmed.startsWith(prefix) && prefix.length > longestPrefixLength) {
        longestPrefixLength = prefix.length;
        bestMatchProvider = provider.id;
      }
    }
  }
  return bestMatchProvider;
}

export async function ensureHostPermission(origin: string): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.permissions) {
    return true;
  }

  const urlPattern = origin.endsWith('/*') ? origin : `${origin.replace(/\/$/, '')}/*`;

  try {
    const hasPermission = await chrome.permissions.contains({
      origins: [urlPattern]
    });
    if (hasPermission) return true;

    const granted = await chrome.permissions.request({
      origins: [urlPattern]
    });
    return granted;
  } catch (e) {
    console.warn('Permission request error:', e);
    return true;
  }
}

export async function validateKeyForProvider(
  providerId: string,
  key: string,
  customProviders: any[] = []
): Promise<ValidationResult> {
  const builtin = BUILTIN_PROVIDERS.find(p => p.id === providerId);

  if (builtin) {
    if (builtin.requiresOptionalPermission) {
      await ensureHostPermission(builtin.baseUrl);
    }

    switch (providerId) {
      case 'anthropic':
        return validateAnthropic(key);
      case 'gemini':
        return validateGemini(key);
      case 'perplexity':
        return validatePerplexity(key);
      case 'groq':
        return validateOpenAICompatible(providerId, 'https://api.groq.com/openai', key, '/v1/models');
      case 'openrouter':
        return validateOpenAICompatible(providerId, 'https://openrouter.ai/api', key, '/v1/models');
      default:
        return validateOpenAICompatible(providerId, builtin.baseUrl, key, '/v1/models');
    }
  }

  // Check custom provider definition
  const custom = customProviders.find(p => p.id === providerId);
  if (custom) {
    await ensureHostPermission(custom.baseUrl);

    const headers: Record<string, string> = { ...custom.headers };
    if (custom.authHeaderName) {
      headers[custom.authHeaderName] = headers[custom.authHeaderName]
        ? headers[custom.authHeaderName].replace('<key>', key)
        : `Bearer ${key}`;
    }

    return validateOpenAICompatible(
      custom.id,
      custom.baseUrl,
      key,
      custom.validatePath || '/v1/models',
      custom.authHeaderName || 'Authorization',
      ''
    );
  }

  throw new Error(`Unknown provider ID: ${providerId}`);
}
