import { describe, it, expect } from 'vitest';
import { autoDetectProviderId } from '../adapters/registry';
import { maskApiKey } from '../utils/crypto';
import { parseCurlCommand } from '../utils/curlParser';

describe('KeyStinger Core Utilities', () => {
  it('correctly auto-detects provider IDs from API key prefixes', () => {
    expect(autoDetectProviderId('sk-proj-1234567890abcdef')).toBe('openai');
    expect(autoDetectProviderId('sk-ant-api03-abcdef')).toBe('anthropic');
    expect(autoDetectProviderId('AIzaSyD-123456789')).toBe('gemini');
    expect(autoDetectProviderId('nvapi-abcdef123456')).toBe('nvidia');
    expect(autoDetectProviderId('gsk_1234567890abcdef')).toBe('groq');
    expect(autoDetectProviderId('pplx-1234567890abcdef')).toBe('perplexity');
    expect(autoDetectProviderId('sk-or-v1-abcdef')).toBe('openrouter');
  });

  it('correctly masks API key credentials for safety', () => {
    expect(maskApiKey('sk-proj-1234567890abcdef')).toBe('sk-••••cdef');
    expect(maskApiKey('sk-ant-12345678')).toBe('sk-••••5678');
    expect(maskApiKey('short')).toBe('••••••••');
  });

  it('safely parses cURL commands into structured request objects', () => {
    const curl = `curl https://api.openai.com/v1/models -H "Authorization: Bearer sk-test1234"`;
    const parsed = parseCurlCommand(curl);

    expect(parsed.url).toBe('https://api.openai.com/v1/models');
    expect(parsed.method).toBe('GET');
    expect(parsed.headers['Authorization']).toBe('Bearer sk-test1234');
    expect(parsed.authHeaderName).toBe('Authorization');
  });

  it('rejects malicious shell injection syntax in cURL commands', () => {
    const maliciousCurl = `curl https://example.com $(rm -rf /)`;
    expect(() => parseCurlCommand(maliciousCurl)).toThrow('Security check failed');
  });
});
