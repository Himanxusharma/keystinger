# Chrome Web Store Listing & Preparation — KeyStinger

**Last Updated:** August 2026  
**Extension Name:** KeyStinger  
**Version:** 1.0.0  
**Target Category:** Developer Tools  

---

## 1. Store Metadata & Copy

### Short Description (max 132 chars)
Instant multi-provider AI API key validator, live model discovery, request traffic inspector, and encrypted local key vault.

### Detailed Store Description
KeyStinger is a lightweight, privacy-first developer extension for validating AI provider API keys, discovering live accessible models, inspecting HTTP exchange traffic, and managing your credential health directly from your browser.

**Core Capabilities:**
- ⚡ **Instant Key Verification**: Paste any API key and get an accurate pass/fail validation in under 2 seconds. Auto-detects provider prefixes (`sk-`, `sk-ant-`, `nvapi-`, `AIza`, `gsk_`, `pplx-`, `sk-or-`).
- 🤖 **Live Model Discovery**: Browses real entitled models returned by provider endpoints—not a static hardcoded list.
- 💻 **Ready-to-Use Snippets**: Generates pre-filled, model-specific code snippets for cURL, JavaScript (Fetch), and Python.
- 🌐 **Multi-Provider Support**: Supports OpenAI, Anthropic (Claude), Google Gemini, NVIDIA NIM, Mistral AI, Groq, xAI (Grok), Cohere, Perplexity, DeepSeek, Together AI, and OpenRouter out of the box.
- ⚡ **Custom Providers via cURL**: Paste a cURL command from provider docs or DevTools to convert any self-hosted model or internal gateway into a validatable provider.
- 🔍 **Traffic Inspector**: Inspect raw HTTP request headers, response status, and JSON payloads with automatic API key masking (`sk-••••1234`).
- 🔒 **Client-Side Encrypted Vault**: Stores credentials locally in `chrome.storage.local` encrypted at rest with WebCrypto AES-GCM.
- 🚀 **Zero Backend Guarantee**: Every validation call goes directly from your browser to official provider APIs using `fetch()`. No proxy server ever sees or stores your keys.

---

## 2. Permissions Justification

| Permission / Host | Type | Plain-English Justification |
|---|---|---|
| `storage` | Permission | Required to store encrypted API keys and custom provider definitions locally via `chrome.storage.local`. |
| `https://api.openai.com/*` | Host Permission | Required to validate OpenAI API keys and fetch model entitlements directly. |
| `https://api.anthropic.com/*` | Host Permission | Required to validate Anthropic (Claude) API keys and fetch model entitlements directly. |
| `https://generativelanguage.googleapis.com/*` | Host Permission | Required to validate Google Gemini API keys and fetch model entitlements directly. |
| `https://integrate.api.nvidia.com/*` | Host Permission | Required to validate NVIDIA NIM API keys and fetch model entitlements directly. |
| `optional_host_permissions` | Host Permission | Requested dynamically at runtime when the user selects a long-tail provider (Mistral, Groq, xAI, OpenRouter, etc.) or defines a custom cURL origin. |

---

## 3. Privacy & Data Handling Disclosures

- **Data Collected**: None. KeyStinger does NOT collect, track, or transmit any user data, telemetry, or credentials to any third-party analytics or developer server.
- **Data Storage**: API keys and custom headers are stored locally on the user's device encrypted at rest with WebCrypto AES-GCM.
- **Network Calls**: Direct client-to-provider HTTPS `fetch()` requests only.

---

## 4. How to Package for Store Submission

```bash
# 1. Run full build & tests
npm test
npm run build

# 2. Package dist directory into zip file
cd dist
zip -r ../keystinger-v1.0.0.zip .
```
