# KeyStinger — Technical Requirement Document (TRD)

**Product Name**: KeyStinger (`keystinger`)  
**Architecture**: React 18 + TypeScript + Vite + Tailwind CSS v4 + Manifest V3  
**Testing Framework**: Vitest  

---

## 1. System Architecture Overview

KeyStinger operates entirely on the user's local client browser. There are **zero intermediate backend servers**.

```
[User Browser / Extension Popup]
       │
       ├── WebCrypto AES-GCM 256-bit ──► chrome.storage.local (Encrypted Vault)
       │
       └── Direct fetch() calls ─────────► Official Provider Endpoints
                                             ├── api.openai.com
                                             ├── api.anthropic.com
                                             ├── generativelanguage.googleapis.com
                                             └── api.groq.com / openrouter.ai...
```

---

## 2. Cryptographic Security & Storage

### Encryption Algorithm
- **AES-GCM 256-bit** (`crypto.subtle.generateKey` and `crypto.subtle.encrypt`).
- Initialization Vector (`IV`): 12-byte random array per encryption call.
- Plaintext API keys are held strictly in transient React component state during active operations and never stored unencrypted on disk.

### Storage Interface (`src/utils/storage.ts`)
- Primary: `chrome.storage.local`
- Fallback: `localStorage` / In-memory store for Vitest testing environments.

---

## 3. Provider Adapters & Registry

- **OpenAI Compatible Base Adapter** (`src/adapters/base.ts`): OpenAI, NVIDIA, Mistral, Groq, xAI, Perplexity, DeepSeek, Together, OpenRouter.
- **Anthropic Adapter** (`src/adapters/anthropic.ts`): Enforces `x-api-key` and `anthropic-version: 2023-06-01`.
- **Google Gemini Adapter** (`src/adapters/gemini.ts`): Enforces `x-goog-api-key`.
- **Registry & Longest Prefix Detection** (`src/adapters/registry.ts`): Matches longest prefix first to prevent generic `sk-` collision.

---

## 4. Developer Tools & Verification Pipeline

- **Token Counter & Cost Estimator**: `src/utils/pricing.ts` & `src/components/TokenCounter.tsx`.
- **Rate Limit Decoder**: `src/utils/rateLimitDecoder.ts` & `src/components/ValidateForm.tsx`.
- **Batch `.env` Parser**: `src/utils/envBatchParser.ts` & `src/components/BatchEnvImporter.tsx`.
- **Test-Prompt Execution Sandbox**: `src/components/TestPromptSandbox.tsx`.
- **Multi-Key Load Balancer**: `src/components/LoadBalancerGenerator.tsx`.
- **Automated Vitest Suite**: `src/__tests__/unit.test.ts` (9 unit tests passing 100%).
