export interface ParsedCurl {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: string;
  authHeaderName?: string;
  authHeaderValue?: string;
  warnings: string[];
}

export function parseCurlCommand(rawCurl: string): ParsedCurl {
  const warnings: string[] = [];
  const cleanInput = rawCurl.replace(/\\\r?\n/g, ' ').trim();

  // Safety Checks
  if (cleanInput.includes('$(') || cleanInput.includes('`')) {
    throw new Error('Security check failed: Command substitution ($(...) or backticks) detected.');
  }

  if (/-o\s+|--output\s+/.test(cleanInput)) {
    throw new Error('Security check failed: File writing options (-o or --output) are not allowed.');
  }

  if (/--data-binary\s+@/.test(cleanInput)) {
    throw new Error('Security check failed: File uploads via @file are not supported in browser parsing.');
  }

  // Tokenizer handling quoted strings and escaped characters
  const tokens: string[] = [];
  let currentToken = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (currentToken.length > 0) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } else {
      currentToken += char;
    }
  }
  if (currentToken.length > 0) {
    tokens.push(currentToken);
  }

  let url = '';
  let method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET';
  const headers: Record<string, string> = {};
  let body: string | undefined = undefined;
  let authHeaderName: string | undefined = undefined;
  let authHeaderValue: string | undefined = undefined;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === 'curl' || token === 'curl.exe') {
      continue;
    }

    if (token === '-X' || token === '--request') {
      const nextToken = tokens[i + 1]?.toUpperCase();
      if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(nextToken)) {
        method = nextToken as any;
        i++;
      }
    } else if (token === '-H' || token === '--header') {
      const headerStr = tokens[i + 1];
      if (headerStr && headerStr.includes(':')) {
        const colonIdx = headerStr.indexOf(':');
        const hKey = headerStr.slice(0, colonIdx).trim();
        const hVal = headerStr.slice(colonIdx + 1).trim();
        headers[hKey] = hVal;

        if (/authorization/i.test(hKey) || /x-api-key/i.test(hKey) || /api-key/i.test(hKey)) {
          authHeaderName = hKey;
          authHeaderValue = hVal;
        }
        i++;
      }
    } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-urlencode') {
      body = tokens[i + 1] || '';
      if (method === 'GET') {
        method = 'POST';
      }
      i++;
    } else if (token.startsWith('http://') || token.startsWith('https://')) {
      url = token.replace(/^['"]|['"]$/g, '');
    } else if (!url && !token.startsWith('-')) {
      const sanitized = token.replace(/^['"]|['"]$/g, '');
      if (sanitized.includes('.')) {
        url = sanitized.startsWith('http') ? sanitized : `https://${sanitized}`;
      }
    }
  }

  if (!url) {
    throw new Error('Invalid cURL: Could not parse a valid URL.');
  }

  if (url.startsWith('http://')) {
    warnings.push('URL uses unencrypted HTTP. HTTPS is strongly recommended.');
  }

  return {
    url,
    method,
    headers,
    body,
    authHeaderName,
    authHeaderValue,
    warnings
  };
}

export function exportToCurl(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string
): string {
  const parts = [`curl -X ${method.toUpperCase()} "${url}"`];

  Object.entries(headers).forEach(([k, v]) => {
    parts.push(`  -H "${k}: ${v.replace(/"/g, '\\"')}"`);
  });

  if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    parts.push(`  -d '${body.replace(/'/g, "'\\''")}'`);
  }

  return parts.join(' \\\n');
}
