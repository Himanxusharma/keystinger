import { autoDetectProviderId, BUILTIN_PROVIDERS } from '../adapters/registry';

export interface ExtractedEnvKey {
  variableName: string;
  rawKey: string;
  providerId: string;
  providerName: string;
}

export function parseEnvFileContent(envText: string): ExtractedEnvKey[] {
  if (!envText) return [];

  const results: ExtractedEnvKey[] = [];
  const lines = envText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;

    const varName = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    if (!val || val.length < 8) continue;

    // Check if key auto-detects or matches known key naming convention
    let detectedId = autoDetectProviderId(val);

    if (!detectedId) {
      // Check variable name hinting (e.g. OPENAI_API_KEY)
      const varUpper = varName.toUpperCase();
      for (const p of BUILTIN_PROVIDERS) {
        const pUpper = p.id.toUpperCase();
        if (varUpper.includes(pUpper) || (pUpper === 'ANTHROPIC' && varUpper.includes('CLAUDE'))) {
          detectedId = p.id;
          break;
        }
      }
    }

    if (detectedId) {
      const builtin = BUILTIN_PROVIDERS.find(p => p.id === detectedId);
      results.push({
        variableName: varName,
        rawKey: val,
        providerId: detectedId,
        providerName: builtin ? builtin.displayName : detectedId
      });
    }
  }

  return results;
}
