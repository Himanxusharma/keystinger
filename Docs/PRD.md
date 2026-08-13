# KeyStinger — Product Requirement Document (PRD)

**Product Name**: KeyStinger (`keystinger`)  
**Type**: Chrome Browser Extension (Manifest V3)  
**License**: Open Source (MIT License)  
**Target Audience**: AI Developers, Prompt Engineers, DevOps, Software Architects  

---

## 1. Product Vision & Goals

KeyStinger is an open-source, privacy-first Chrome Extension that provides instant multi-provider AI API key validation, model discovery, traffic inspection, token counting, batch `.env` file ingestion, and developer toolbelt utilities across 12+ AI providers.

### Core Principles
1. **Zero-Backend Guarantee**: 100% direct browser `fetch()` requests to official API endpoints. No cloud middleman proxy servers.
2. **AES-GCM WebCrypto Encryption**: Credentials saved to `chrome.storage.local` are encrypted with 256-bit WebCrypto AES-GCM.
3. **Developer-First Ergonomics**: Instant key auto-detection, copyable official SDK code snippets (Node, Python, cURL, JS), and token cost math.

---

## 2. Supported AI Providers

- **OpenAI** (`sk-proj-`, `sk-admin-`, `sk-`)
- **Anthropic (Claude)** (`sk-ant-`)
- **Google Gemini** (`AIza`)
- **NVIDIA NIM** (`nvapi-`)
- **Groq** (`gsk_`)
- **Mistral AI** (Optional Host Permission)
- **xAI (Grok)** (`xai-`)
- **Cohere** (Optional Host Permission)
- **Perplexity** (`pplx-`)
- **DeepSeek** (Optional Host Permission)
- **Together AI** (Optional Host Permission)
- **OpenRouter** (`sk-or-`)
- **Custom Gateway/Provider** (Pasted cURL command parser)

---

## 3. Feature Breakdown Across Phases

### Phase 1: MVP Core Validation & Traffic Inspector
- Live API key validation & entitlement discovery (`GET /v1/models`).
- Prefix auto-detection (`sk-proj-`, `sk-ant-`, `nvapi-`, `AIza`, `gsk_`, `pplx-`, `sk-or-`).
- Credential masking (`sk-••••1234`).
- Traffic Inspector capturing raw HTTP request/response payloads (`CapturedExchange`).
- Custom Provider Modal for self-hosted/local LLM gateways via cURL parsing (`curlconverter`).

### Phase 2: Vault Health Audit & Encrypted Backup
- Bulk Re-Check All Keys with progress indicator.
- Key Health Analytics Bar (Total, Valid, Limited, Invalid).
- Vault Search & Status Filters.
- Encrypted Vault Export/Import (`keystinger-vault-backup.json`).

### Phase 3: Developer Toolbelt Utilities
- Token Counter & Cost Estimator.
- Environment Variable Exporter (`.env` / Vercel JSON / GitHub Actions CI).
- Side-by-Side Model Diff & Compare.
- Service Worker Alarms (`chrome.alarms`) & Context Menu (`chrome.contextMenus`).

### Phase 4: Ecosystem Expansion & Ultimate Developer Features
- Rate-Limit Header Decoder (`x-ratelimit-*`, `anthropic-ratelimit-*`).
- Live Provider Status Page Shortcuts (`status.openai.com`, `status.anthropic.com`, `status.cloud.google.com`).
- Model Changelog Watcher diffing model lists against saved snapshots (`✨ N new models!`).
- Multi-Key Load Balancer Code Generator (Node.js & Python).
- Test-Prompt Execution Sandbox for live inference quota testing.
- Batch `.env` File Importer & Auto-Validator.
- Key Rotation Age Tracker & Reminders (`🔐 Rotation Due`).
- Free Tier API Keys & Limits Directory.
- Minimal Green Square & Black Dot App Icon branding.

---

## 4. Security & Open Source Compliance

- **License**: MIT License (`LICENSE`).
- **Manifest V3 Specification**: Declarative host permissions, service worker background script, zero `unsafe-eval`.
- **Unit Test Coverage**: Vitest unit test suite covering key prefix detection, credential masking, cURL parsing, vault serialization, token estimation, rate-limit header decoding, and `.env` parsing.
