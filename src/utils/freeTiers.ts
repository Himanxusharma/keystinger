export interface FreeTierInfo {
  providerId: string;
  providerName: string;
  isCompletelyFree: boolean;
  freeLimitSummary: string;
  rpmLimit?: string;
  rpdLimit?: string;
  creditGrant?: string;
  getKeyUrl: string;
  badgeLabel: string;
}

export const FREE_TIER_DATABASE: FreeTierInfo[] = [
  {
    providerId: 'gemini',
    providerName: 'Google Gemini',
    isCompletelyFree: true,
    freeLimitSummary: 'Free tier includes 15 RPM, 1M TPM & 1,500 RPD for Gemini 1.5 Flash & Pro in AI Studio.',
    rpmLimit: '15 RPM',
    rpdLimit: '1,500 RPD',
    creditGrant: 'No credit card required',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    badgeLabel: '100% Free Tier'
  },
  {
    providerId: 'groq',
    providerName: 'Groq Cloud',
    isCompletelyFree: true,
    freeLimitSummary: 'Ultra-fast Llama 3.1 & Mixtral inference free tier with generous daily allowances.',
    rpmLimit: '30 RPM',
    rpdLimit: '14,400 RPD',
    creditGrant: 'No credit card required',
    getKeyUrl: 'https://console.groq.com/keys',
    badgeLabel: '100% Free Tier'
  },
  {
    providerId: 'nvidia',
    providerName: 'NVIDIA NIM',
    isCompletelyFree: true,
    freeLimitSummary: 'Free 1,000 API trial credits to test enterprise NIM microservices.',
    creditGrant: '1,000 Free Credits',
    getKeyUrl: 'https://build.nvidia.com',
    badgeLabel: '1,000 Free Credits'
  },
  {
    providerId: 'mistral',
    providerName: 'Mistral AI',
    isCompletelyFree: true,
    freeLimitSummary: 'Free Experiment Tier for Codestral, Mistral 7B, and open-weights models.',
    rpmLimit: '1 RPM (Free)',
    creditGrant: 'Free Experimentation',
    getKeyUrl: 'https://console.mistral.ai/api-keys/',
    badgeLabel: 'Free Exp. Tier'
  },
  {
    providerId: 'cohere',
    providerName: 'Cohere',
    isCompletelyFree: true,
    freeLimitSummary: 'Free Trial Key available for non-production development and evaluation.',
    rpmLimit: '1,000 reqs/mo',
    creditGrant: 'Free Trial Key',
    getKeyUrl: 'https://dashboard.cohere.com/api-keys',
    badgeLabel: 'Free Trial Key'
  },
  {
    providerId: 'openrouter',
    providerName: 'OpenRouter',
    isCompletelyFree: true,
    freeLimitSummary: 'Access to 10+ completely free LLM models (Llama 3, Gemma, Qwen free endpoints).',
    creditGrant: 'Free Models Hosted',
    getKeyUrl: 'https://openrouter.ai/keys',
    badgeLabel: 'Free Models'
  },
  {
    providerId: 'together',
    providerName: 'Together AI',
    isCompletelyFree: false,
    freeLimitSummary: '$5 initial free trial API credit granted upon new developer registration.',
    creditGrant: '$5 Free Credits',
    getKeyUrl: 'https://api.together.ai/settings/api-keys',
    badgeLabel: '$5 Free Credit'
  },
  {
    providerId: 'openai',
    providerName: 'OpenAI',
    isCompletelyFree: false,
    freeLimitSummary: 'Initial $5 free API credit granted to new eligible platform accounts.',
    creditGrant: '$5 Trial (New Accounts)',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    badgeLabel: '$5 Trial Credit'
  },
  {
    providerId: 'anthropic',
    providerName: 'Anthropic (Claude)',
    isCompletelyFree: false,
    freeLimitSummary: '$5 evaluation credits granted upon organization registration and phone verification.',
    creditGrant: '$5 Eval Credit',
    getKeyUrl: 'https://console.anthropic.com/settings/keys',
    badgeLabel: '$5 Eval Credit'
  }
];
