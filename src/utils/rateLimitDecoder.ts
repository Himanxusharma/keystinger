export interface RateLimitInfo {
  remainingRequests?: number;
  remainingTokens?: number;
  resetRequestsStr?: string;
  resetTokensStr?: string;
  message: string;
}

export function parseRateLimitHeaders(headers: Record<string, string>): RateLimitInfo | null {
  if (!headers) return null;

  // Normalize header keys to lowercase
  const lower: Record<string, string> = {};
  Object.entries(headers).forEach(([k, v]) => {
    lower[k.toLowerCase()] = v;
  });

  const remRequests =
    lower['x-ratelimit-remaining-requests'] ||
    lower['x-ratelimit-remaining'] ||
    lower['anthropic-ratelimit-requests-remaining'];

  const remTokens =
    lower['x-ratelimit-remaining-tokens'] ||
    lower['anthropic-ratelimit-tokens-remaining'];

  const resetReq =
    lower['x-ratelimit-reset-requests'] ||
    lower['x-ratelimit-reset'] ||
    lower['anthropic-ratelimit-requests-reset'];

  if (!remRequests && !remTokens && !resetReq) {
    return null;
  }

  const parts: string[] = [];
  let reqNum: number | undefined = undefined;
  let tokNum: number | undefined = undefined;

  if (remRequests) {
    reqNum = parseInt(remRequests, 10);
    if (!isNaN(reqNum)) {
      parts.push(`${reqNum.toLocaleString()} reqs left`);
    }
  }

  if (remTokens) {
    tokNum = parseInt(remTokens, 10);
    if (!isNaN(tokNum)) {
      parts.push(`${Math.round(tokNum / 1000)}k tokens left`);
    }
  }

  if (resetReq) {
    parts.push(`resets in ${resetReq}`);
  }

  return {
    remainingRequests: reqNum,
    remainingTokens: tokNum,
    resetRequestsStr: resetReq,
    message: parts.join(' • ')
  };
}
