import { ValidationResult, ModelInfo, CapturedExchange } from '../types';

export async function validateGemini(key: string): Promise<ValidationResult> {
  const startTime = Date.now();
  const fullUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  const headers: Record<string, string> = {
    'x-goog-api-key': key.trim(),
    'Accept': 'application/json'
  };

  const exchangeId = `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const responseBody = await res.text();

    const exchange: CapturedExchange = {
      id: exchangeId,
      timestamp: startTime,
      providerId: 'gemini',
      request: {
        method: 'GET',
        url: fullUrl,
        headers
      },
      response: {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: responseBody,
        durationMs
      }
    };

    if (res.ok) {
      let modelsData: ModelInfo[] = [];
      try {
        const parsed = JSON.parse(responseBody);
        const rawList = Array.isArray(parsed.models) ? parsed.models : [];
        modelsData = rawList.map((m: any) => {
          const rawId = m.name || '';
          const cleanId = rawId.startsWith('models/') ? rawId.replace('models/', '') : rawId;
          return {
            id: cleanId,
            name: m.displayName || cleanId,
            contextWindow: m.inputTokenLimit
          };
        });
      } catch (e) {
        modelsData = [{ id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }];
      }

      return {
        valid: true,
        statusCode: res.status,
        durationMs,
        models: modelsData,
        exchange
      };
    } else {
      let errorMessage = `Gemini API returned status code ${res.status}`;
      try {
        const parsed = JSON.parse(responseBody);
        if (parsed.error?.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {
        // ignore
      }

      return {
        valid: false,
        statusCode: res.status,
        durationMs,
        models: [],
        error: {
          code: String(res.status),
          message: errorMessage
        },
        exchange
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';
    const message = isTimeout ? 'Request timed out after 8 seconds.' : err.message || 'Network error.';

    const exchange: CapturedExchange = {
      id: exchangeId,
      timestamp: startTime,
      providerId: 'gemini',
      request: {
        method: 'GET',
        url: fullUrl,
        headers
      },
      response: {
        status: 0,
        statusText: isTimeout ? 'Timeout' : 'Network Error',
        headers: {},
        body: JSON.stringify({ error: message }),
        durationMs
      }
    };

    return {
      valid: false,
      statusCode: 0,
      durationMs,
      models: [],
      error: {
        code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        message
      },
      exchange
    };
  }
}
