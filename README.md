<div align="center">

  # ⚡ KeyStinger

  **The Privacy-First, Multi-Provider AI API Key Vault & Developer Toolbelt Chrome Extension**

  [![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
  [![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-amber.svg)](manifest.json)
  [![React 18](https://img.shields.io/badge/React-18-blue.svg)](package.json)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](tsconfig.json)
  [![Vitest](https://img.shields.io/badge/Tests-9%2F9%20Passing-emerald.svg)](src/__tests__/unit.test.ts)
  [![Privacy](https://img.shields.io/badge/Privacy-100%25%20On--Device-brightgreen.svg)](#-security--privacy-guarantee)

  <p align="center">
    Instant live key validation, model discovery, traffic inspection, token counting, batch <code>.env</code> import, and developer toolbelt for 12+ AI providers.
  </p>

</div>

---

## ✨ Features

- **🌐 12+ Built-in AI Providers & Adapters**: Supports OpenAI, Anthropic (Claude), Google Gemini, NVIDIA NIM, Mistral AI, Groq, xAI (Grok), Cohere, Perplexity, DeepSeek, Together AI, and OpenRouter.
- **⚡ Longest Prefix Auto-Detection**: Typing a key (`sk-proj-`, `sk-ant-`, `nvapi-`, `AIza`, `gsk_`, `pplx-`, `sk-or-`) instantly selects the provider.
- **🛡️ AES-256 WebCrypto Encryption at Rest**: Credentials saved to `chrome.storage.local` are encrypted with 256-bit WebCrypto AES-GCM algorithms.
- **🔒 Zero-Backend Architecture**: 100% direct browser `fetch()` calls to official API endpoints. No middleman cloud proxy, no telemetry, no tracking.
- **🧪 Test-Prompt Execution Sandbox**: Fire 1-sentence completion prompts directly inside the popup to verify live inference quota and measure real round-trip latency (ms).
- **📄 Batch `.env` File Importer**: Paste an entire `.env` string; KeyStinger extracts recognized API keys, batch-validates them concurrently, and saves all live keys to your vault in 1 click.
- **🎁 Free Tier & Limits Directory**: Built-in guide highlighting providers offering 100% free API key tiers (Google Gemini 1,500 RPD, Groq 14,400 RPD, NVIDIA 1,000 Free Credits, OpenRouter Free Models).
- **🧮 Token Counter & Cost Estimator**: Estimate prompt token counts and calculate estimated API spend across top LLM model pricing tiers.
- **🔄 Side-by-Side Model Diff**: Compare two models side-by-side: context window, input/output cost per 1M tokens, key format, and cURL endpoints.
- **🔄 Multi-Key Load Balancer Generator**: Generates ready-to-copy round-robin and fallback key rotation code snippets for Node.js and Python.
- **🔐 Key Rotation Age Tracker**: Displays key creation age (e.g. `12d old`) and highlights keys older than 60 days with a security reminder (`🔐 Rotation Due`).
- **⚡ Rate-Limit Header Decoder**: Parses `x-ratelimit-*` and `anthropic-ratelimit-*` headers into plain language badges (`⚡ 42 reqs left • resets in 12s`).

---

## 🔒 Security & Privacy Guarantee

KeyStinger was built from the ground up to protect your API keys:

1. **No External Servers**: KeyStinger has **zero cloud servers**. All API validation and request calls originate directly from your local browser to official provider endpoints.
2. **Encrypted Storage**: Plaintext keys are never stored on disk. Encryption keys are generated via WebCrypto API.
3. **Open Source Auditability**: 100% open-source code under the MIT License. Anyone can inspect the code to verify zero telemetry or data leaks.

---

## 🚀 Quickstart & Developer Setup

### Prerequisites
- Node.js 18+ and `npm`

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/keystinger.git
cd keystinger

# Install dependencies
npm install

# Run unit tests
npm test

# Build for production
npm run build
```

### Loading the Unpacked Extension in Chrome

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the build output directory: `/path/to/keystinger/dist`.
5. KeyStinger is ready for use!

---

## 🛠️ Project Structure

```
keystinger/
├── dist/                      # Production extension build output (MV3)
├── manifest.json              # Extension Manifest V3 definition
├── background.ts              # Service worker (Alarms & Context Menus)
├── public/icons/              # Extension icons (16x16, 48x48, 128x128)
├── src/
│   ├── adapters/              # Provider adapters (OpenAI, Anthropic, Gemini...)
│   ├── components/            # React UI components (Vault, Tools, Sandbox...)
│   ├── types/                 # TypeScript interfaces and schemas
│   ├── utils/                 # Crypto, Storage, cURL parser, Pricing, RateLimit
│   └── __tests__/             # Vitest unit test suite
├── LICENSE                    # MIT Open Source License
└── package.json               # Package dependencies & scripts
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to add a new AI provider adapter, fix a bug, or enhance developer tooling:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-adapter`).
3. Commit your changes (`git commit -m 'Add support for MyAI Provider'`).
4. Run tests to ensure 100% pass (`npm test && npm run build`).
5. Push to the branch and open a Pull Request.

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
