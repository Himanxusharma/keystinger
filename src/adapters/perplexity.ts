import { ValidationResult, ModelInfo, CapturedExchange } from '../types';

export async function validatePerplexity(key: string): Promise<ValidationResult> {
  const startTime = Date.now();
  const fullUrl = 'https://api.perplexity.ai/chat/completions';

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${key.trim()}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const exchangeId = `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  // Send minimal invalid model completion payload to test auth without incurring cost
  const testBody = JSON.stringify({
    model: 'sonar-reasoning',
    messages: [{ role: 'user', content: 'ping' }],
    max_tokens: 1
  });

  try {
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: testBody,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const responseBody = await res.text();

    const exchange: CapturedExchange = {
      id: exchangeId,
      timestamp: startTime,
      providerId: 'perplexity',
      request: {
        method: 'POST',
        url: fullUrl,
        headers,
        body: testBody
      },
      response: {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: responseBody,
        durationMs
      }
    };

    // If HTTP 200 or 400 (model not found / bad payload) key is valid. 401/403 means bad key.
    const isValidKey = res.status === 200 || res.status === 400;

    const staticModels: ModelInfo[] = [
      { id: 'sonar', name: 'Sonar (Llama 3.1 8B Search)' },
      { id: 'sonar-pro', name: 'Sonar Pro (Llama 3.1 70B Search)' },
      { id: 'sonar-reasoning', name: 'Sonar Reasoning (DeepSeek R1 Search)' },
      { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro' },
      { id: 'r1-1776', name: 'R1-1776 (Uncensored R1)' }
    ];

    if (isValidKey) {
      return {
        valid: true,
        statusCode: res.status,
        durationMs,
        models: staticModels,
        exchange
      };
    } else {
      let errorMessage = `Perplexity returned status code ${res.status}`;
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
      providerId: 'perplexity',
      request: {
        method: 'POST',
        url: fullUrl,
        headers,
        body: testBody
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
