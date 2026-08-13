# KeyStinger — Multi-Provider API Key Validator (Chrome Extension)

A lightweight Chrome extension that lets developers paste an AI provider API key, instantly verify it's live, and browse exactly which models that key can access — all without the key ever leaving the browser.

## Why this exists

Every AI provider ships its own dashboard, its own key format, and its own way of listing models. Developers juggling five or six provider keys (OpenAI, Anthropic, Gemini, NVIDIA NIM, Mistral, Groq...) have no single place to check "is this key still alive, and what can it do?" This extension is that single place.

## Core capabilities

- **Paste-and-validate**: enter a key, pick a provider (or let the extension auto-detect from the key's prefix), and get a pass/fail result in under a second.
- **Live model discovery**: on a successful validation, the extension calls that provider's model-listing endpoint and shows exactly which models the key is entitled to use — not a static hardcoded list.
- **Model picker**: once verified, the user selects a model from the *actual* returned list to use as a default elsewhere (e.g., in another one of your extensions/apps).
- **Multi-provider, one UI**: OpenAI, Anthropic, Google Gemini, NVIDIA NIM, Mistral, Groq, xAI (Grok), Cohere, Perplexity, DeepSeek, Together AI, OpenRouter — see the full matrix in [TRD.md](./TRD.md#provider-integration-matrix).
- **Custom providers via paste-a-curl**: got a self-hosted model, an internal gateway, or a provider not in the list? Paste a curl command from its docs or DevTools and the extension turns it into a reusable, validatable provider.
- **Request/response inspector**: every call — built-in or custom — shows you the exact raw request and raw response, with the key masked by default. No black box.
- **Custom request sender**: a free-form request builder for one-off checks against any URL, independent of the built-in validation flow — a lightweight Postman-in-your-popup.
- **Local-only key storage**: keys are stored in `chrome.storage.local`, encrypted at rest, and every call is made directly from the browser to the destination — no proxy backend ever sees a raw key.
- **Key health dashboard**: at a glance, see which of your saved keys are valid, expired, rate-limited, or revoked.

## Pricing

**Free. No Pro tier, no paywalled features, no account required.** Every feature above ships free for now — see [PRD.md](./PRD.md#7-monetization) for the reasoning.

## Who it's for

Indie devs, agencies, and internal tooling teams who manage multiple AI vendor keys across projects and want a fast, trustworthy sanity check before wiring a key into production code.

## Documents in this repo

| Doc | Purpose |
|---|---|
| `README.md` | This file — product overview |
| `PRD.md` | Product Requirements Document — problem, personas, scope, roadmap, monetization |
| `TRD.md` | Technical Requirements Document — architecture, provider API matrix, security model, manifest, data flow |

## Quick start (planned dev workflow)

```bash
# clone / scaffold
npm create vite@latest keystinger -- --template react-ts
cd keystinger
npm install

# dev build with hot reload against Chrome MV3
npm run dev

# load unpacked
# chrome://extensions -> Developer mode -> Load unpacked -> /dist
```

## Tech stack (proposed)

- Manifest V3, React + TypeScript, Vite (CRXJS plugin for MV3 HMR)
- `chrome.storage.local` + WebCrypto (AES-GCM) for at-rest key encryption
- No backend required for MVP — all provider calls are direct `fetch()` from the extension's service worker / popup
- Tailwind CSS for a minimal, dense UI (popup constrained to ~400x600px)

## License / Status

Pre-build — this repo currently contains planning docs (PRD + TRD) only.
