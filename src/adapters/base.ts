import { ValidationResult, ModelInfo, CapturedExchange } from '../types';

export async function validateOpenAICompatible(
  providerId: string,
  baseUrl: string,
  key: string,
  endpointPath = '/v1/models',
  customAuthHeader = 'Authorization',
  customAuthPrefix = 'Bearer '
): Promise<ValidationResult> {
  const startTime = Date.now();
  const fullUrl = `${baseUrl.replace(/\/$/, '')}${endpointPath}`;

  const headers: Record<string, string> = {
    [customAuthHeader]: `${customAuthPrefix}${key}`.trim(),
    'Accept': 'application/json'
  };

  const exchangeId = `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let statusCode = 0;
  let statusText = '';
  let responseBody = '';
  let durationMs = 0;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    durationMs = Date.now() - startTime;
    statusCode = res.status;
    statusText = res.statusText;
    responseBody = await res.text();

    const exchange: CapturedExchange = {
      id: exchangeId,
      timestamp: startTime,
      providerId,
      request: {
        method: 'GET',
        url: fullUrl,
        headers
      },
      response: {
        status: statusCode,
        statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: responseBody,
        durationMs
      }
    };

    if (res.ok) {
      let modelsData: ModelInfo[] = [];
      try {
        const parsed = JSON.parse(responseBody);
        const rawList = Array.isArray(parsed.data) ? parsed.data : Array.isArray(parsed) ? parsed : [];
        modelsData = rawList.map((m: any) => ({
          id: m.id || m.name || String(m),
          name: m.id || m.name,
          ownedBy: m.owned_by || m.ownedBy,
          contextWindow: m.context_window || m.contextWindow
        }));
      } catch (e) {
        modelsData = [{ id: 'unknown', name: 'Raw response succeeded' }];
      }

      return {
        valid: true,
        statusCode,
        durationMs,
        models: modelsData,
        exchange
      };
    } else {
      let errorMessage = `Provider returned status code ${statusCode}`;
      try {
        const parsed = JSON.parse(responseBody);
        if (parsed.error?.message) {
          errorMessage = parsed.error.message;
        } else if (parsed.message) {
          errorMessage = parsed.message;
        }
      } catch (e) {
        // ignore json parse error
      }

      return {
        valid: false,
        statusCode,
        durationMs,
        models: [],
        error: {
          code: String(statusCode),
          message: errorMessage
        },
        exchange
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    durationMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';
    const message = isTimeout ? 'Request timed out after 8 seconds.' : err.message || 'Network error or CORS restriction.';

    const exchange: CapturedExchange = {
      id: exchangeId,
      timestamp: startTime,
      providerId,
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
