# KeyStinger — Chrome Web Store Submission & Publishing Guide

**Extension Title**: KeyStinger — AI API Key Vault & Developer Toolbelt  
**Short Description**: Privacy-first AI API key validator, live model discovery, traffic inspector, token counter, and developer toolbelt.  
**License**: Open Source (MIT License)  

---

## 📄 Full Description for Chrome Web Store Listing

KeyStinger is an open-source, privacy-first developer toolbelt for managing, validating, and auditing AI API key credentials across 12+ top AI providers.

### 🌟 Key Features

1. **Instant Key Validation & Model Discovery**: Validate API keys for OpenAI, Anthropic (Claude), Google Gemini, NVIDIA NIM, Mistral, Groq, xAI (Grok), Cohere, Perplexity, DeepSeek, Together AI, and OpenRouter in 1 click.
2. **Auto-Detect Key Prefixes**: Automatically detects `sk-proj-`, `sk-ant-`, `nvapi-`, `AIza`, `gsk_`, `pplx-`, and `sk-or-`.
3. **AES-256 WebCrypto Encryption at Rest**: Encrypts all credentials locally in `chrome.storage.local`.
4. **100% On-Device & Zero-Backend Guarantee**: Direct browser requests to official provider endpoints. Zero intermediate servers, zero tracking scripts, zero telemetry.
5. **Test-Prompt Inference Sandbox**: Verify active inference quota and measure round-trip latency (ms).
6. **Batch `.env` Importer**: Paste `.env` strings, batch-validate all keys, and save to vault in 1 click.
7. **Free Tier & Limits Directory**: Built-in guide highlighting providers offering 100% free API keys (Gemini, Groq, NVIDIA, OpenRouter).
8. **Developer Utilities**: Token counter & cost calculator, `.env` exporter, side-by-side model diffing, and multi-key load balancer code generators for Node.js and Python.

---

## 🔒 Single-Purpose & Permissions Justification

| Permission | Purpose & Justification |
|---|---|
| `storage` | Required to persist user's WebCrypto AES-GCM encrypted API key vault locally in `chrome.storage.local`. |
| `contextMenus` | Allows users to right-click highlighted API key text on any web page and select "Validate Key with KeyStinger". |
| `alarms` | Registers a background alarm (`chrome.alarms`) for periodic health checks on saved credentials. |
| `host_permissions` | Enables direct `fetch()` calls to official AI provider endpoints (`api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com`, `integrate.api.nvidia.com`). |

---

## 🔒 Privacy Policy Summary

- **Data Collection**: KeyStinger collects ZERO user data, ZERO analytics, and ZERO telemetry.
- **Data Storage**: All credentials and request logs remain 100% local on the user's device encrypted with WebCrypto AES-GCM 256-bit keys.
- **Data Transmission**: KeyStinger communicates ONLY with the specific AI provider endpoints selected by the user. KeyStinger has no middleman cloud servers.
