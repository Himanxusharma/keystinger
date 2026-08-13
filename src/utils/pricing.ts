export interface ModelPricing {
  modelId: string;
  displayName: string;
  provider: string;
  inputCostPerMillion: number; // in USD
  outputCostPerMillion: number; // in USD
  contextWindow: number;
}

export const MODEL_PRICING_DATABASE: ModelPricing[] = [
  {
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'OpenAI',
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 128000
  },
  {
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'OpenAI',
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: 128000
  },
  {
    modelId: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 200000
  },
  {
    modelId: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku',
    provider: 'Anthropic',
    inputCostPerMillion: 0.25,
    outputCostPerMillion: 1.25,
    contextWindow: 200000
  },
  {
    modelId: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    provider: 'Google Gemini',
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 5.00,
    contextWindow: 2000000
  },
  {
    modelId: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    provider: 'Google Gemini',
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.30,
    contextWindow: 1000000
  },
  {
    modelId: 'llama-3.1-70b-versatile',
    displayName: 'Llama 3.1 70B (Groq)',
    provider: 'Groq',
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
    contextWindow: 131072
  },
  {
    modelId: 'deepseek-chat',
    displayName: 'DeepSeek V3',
    provider: 'DeepSeek',
    inputCostPerMillion: 0.14,
    outputCostPerMillion: 0.28,
    contextWindow: 64000
  }
];

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  // Standard heuristic: ~4 characters per token or ~0.75 words per token
  const charBasedTokens = Math.ceil(chars / 4);
  const wordBasedTokens = Math.ceil(words / 0.75);
  return Math.max(charBasedTokens, wordBasedTokens);
}

export function calculateEstimatedCost(
  modelId: string,
  inputTokenCount: number,
  outputTokenCount: number = 500
): { inputCost: number; outputCost: number; totalCost: number; pricing: ModelPricing } {
  const pricing = MODEL_PRICING_DATABASE.find(m => m.modelId === modelId) || MODEL_PRICING_DATABASE[0];

  const inputCost = (inputTokenCount / 1000000) * pricing.inputCostPerMillion;
  const outputCost = (outputTokenCount / 1000000) * pricing.outputCostPerMillion;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    pricing
  };
}
