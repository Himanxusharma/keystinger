import { ValidationResult, ModelInfo, CapturedExchange } from '../types';

export async function validateAnthropic(key: string): Promise<ValidationResult> {
  const startTime = Date.now();
  const fullUrl = 'https://api.anthropic.com/v1/models';

  const headers: Record<string, string> = {
    'x-api-key': key.trim(),
    'anthropic-version': '2023-06-01',
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
      providerId: 'anthropic',
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
        const rawList = Array.isArray(parsed.data) ? parsed.data : [];
        modelsData = rawList.map((m: any) => ({
          id: m.id,
          name: m.display_name || m.id,
          ownedBy: 'Anthropic'
        }));
      } catch (e) {
        modelsData = [{ id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' }];
      }

      return {
        valid: true,
        statusCode: res.status,
        durationMs,
        models: modelsData,
        exchange
      };
    } else {
      let errorMessage = `Anthropic returned status code ${res.status}`;
      try {
        const parsed = JSON.parse(responseBody);
        if (parsed.error?.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {
        // ignore json error
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
      providerId: 'anthropic',
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
