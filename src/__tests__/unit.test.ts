import { describe, it, expect } from 'vitest';
import { autoDetectProviderId } from '../adapters/registry';
import { maskApiKey } from '../utils/crypto';
import { parseCurlCommand } from '../utils/curlParser';
import { exportVaultData, importVaultData, getSavedKeys, saveKey, getRequestTemplates, saveRequestTemplate } from '../utils/storage';
import { estimateTokenCount, calculateEstimatedCost } from '../utils/pricing';

describe('KeyStinger Core Utilities (Phase 1, 2 & 3)', () => {
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

  it('exports encrypted vault backup data matching version 1.0.0 schema', async () => {
    const backup = await exportVaultData();
    expect(backup).toBeDefined();
    expect(backup.version).toBe('1.0.0');
    expect(Array.isArray(backup.savedKeys)).toBe(true);
    expect(Array.isArray(backup.customProviders)).toBe(true);
    expect(Array.isArray(backup.requestTemplates)).toBe(true);
  });

  it('imports and deduplicates vault backup data correctly', async () => {
    const backupPayload = {
      version: '1.0.0',
      exportedAt: Date.now(),
      savedKeys: [
        {
          id: 'test_key_1',
          nickname: 'Imported Key',
          providerId: 'openai',
          maskedKey: 'sk-••••1234',
          encryptedKey: 'abc',
          iv: 'xyz',
          createdAt: Date.now()
        }
      ],
      customProviders: [],
      requestTemplates: [
        {
          id: 'test_tmpl_1',
          name: 'Imported Template',
          method: 'GET' as const,
          url: 'https://api.example.com',
          headers: [],
          body: '',
          createdAt: Date.now()
        }
      ]
    };

    await importVaultData(backupPayload);
    const tmpls = await getRequestTemplates();
    const importedTmpl = tmpls.find(t => t.id === 'test_tmpl_1');
    expect(importedTmpl).toBeDefined();
    expect(importedTmpl?.name).toBe('Imported Template');
  });

  it('estimates token counts and API spend correctly', () => {
    const sampleText = "The quick brown fox jumps over the lazy dog. ".repeat(20);
    const tokens = estimateTokenCount(sampleText);
    expect(tokens).toBeGreaterThan(100);

    const cost = calculateEstimatedCost('gpt-4o', tokens, 500);
    expect(cost.inputCost).toBeGreaterThan(0);
    expect(cost.outputCost).toBeGreaterThan(0);
    expect(cost.totalCost).toBe(cost.inputCost + cost.outputCost);
  });
});
