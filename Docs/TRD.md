# Technical Requirements Document — KeyStinger

**Version:** 1.0
**Companion to:** PRD.md
**Last researched:** August 2026 (provider endpoints/headers verified against current docs; re-verify before ship since providers iterate frequently)

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────┐
│              Chrome Extension (MV3)          │
│                                               │
│  ┌───────────┐   ┌────────────────────────┐ │
│  │  Popup UI  │──▶│  Provider Adapter Layer │ │
│  │ (React/TS) │   │  (one module/provider)  │ │
│  └───────────┘   └───────────┬────────────┘ │
│                               │ fetch()       │
│  ┌───────────────────────┐   │               │
│  │ chrome.storage.local   │◀──┘               │
│  │ (AES-GCM encrypted)    │                   │
│  └───────────────────────┘                   │
└──────────────────┬────────────────────────────┘
                    │ direct HTTPS (no proxy backend)
                    ▼
     OpenAI · Anthropic · Gemini · NVIDIA NIM · Mistral ·
     Groq · xAI · Cohere · Perplexity · DeepSeek · OpenRouter
```

**Key design decision: no backend in the request path.** Every validation/list-models call goes straight from the extension's service worker (or popup) to the provider's official API using the user's own key. This eliminates an entire class of "did the vendor's proxy log my key" trust concerns and removes hosting/infra cost — consistent with a lean, revenue-first build.

## 2. Provider integration matrix

All listed endpoints are lightweight `GET` calls used purely for **validation + model discovery** — the extension never calls a completion/generation endpoint.

| Provider | Base URL | Validate/list-models endpoint | Auth header | Key prefix (auto-detect) | Notes |
|---|---|---|---|---|---|
| **OpenAI** | `api.openai.com` | `GET /v1/models` | `Authorization: Bearer <key>` | `sk-` / `sk-proj-` | Returns 200+ models; filter to chat-capable ones for the picker |
| **Anthropic** | `api.anthropic.com` | `GET /v1/models` | `x-api-key: <key>` + `anthropic-version: 2023-06-01` | `sk-ant-` | Anthropic-version header is required, not optional |
| **Google Gemini** | `generativelanguage.googleapis.com` | `GET /v1beta/models` | `x-goog-api-key: <key>` (or `?key=` query param) | `AIza` | Response field is `models[]`, not `data[]` — needs its own response mapper |
| **NVIDIA NIM** | `integrate.api.nvidia.com/v1` | `GET /v1/models` (OpenAI-compatible) | `Authorization: Bearer <key>` | `nvapi-` | Free tier available; OpenAI SDK-compatible, so it can reuse the OpenAI adapter with a swapped base URL |
| **Mistral** | `api.mistral.ai` | `GET /v1/models` | `Authorization: Bearer <key>` | — | OpenAI-compatible shape |
| **Groq** | `api.groq.com/openai/v1` | `GET /models` | `Authorization: Bearer <key>` | `gsk_` | OpenAI-compatible shape |
| **xAI (Grok)** | `api.x.ai/v1` | `GET /v1/models` | `Authorization: Bearer <key>` | `xai-` | OpenAI-compatible shape |
| **Cohere** | `api.cohere.com` | `GET /v1/models` | `Authorization: Bearer <key>` | — | Response schema differs slightly (`models[].name`) |
| **Perplexity** | `api.perplexity.ai` | No public list-models endpoint confirmed; validate via a minimal request or maintain a curated static model list | `Authorization: Bearer <key>` | `pplx-` | Flag as a "static list" provider in the adapter interface until confirmed otherwise |
| **DeepSeek** | `api.deepseek.com` | `GET /v1/models` | `Authorization: Bearer <key>` | — | OpenAI-compatible shape |
| **Together AI** | `api.together.xyz` | `GET /v1/models` | `Authorization: Bearer <key>` | — | OpenAI-compatible shape |
| **OpenRouter** | `openrouter.ai/api/v1` | `GET /models` | `Authorization: Bearer <key>` | `sk-or-` | Aggregator — model list is huge; needs client-side search/filter in the picker |

> Because most non-Google, non-Anthropic providers converged on the OpenAI request/response shape, the adapter layer should implement **one generic "OpenAI-compatible" adapter** (base URL + bearer header + `GET /models` → `data[]`) and only write bespoke adapters for the three true outliers: **Anthropic** (`x-api-key`, versioned header), **Gemini** (`x-goog-api-key`, `models[]` field, `models/` prefix on IDs), and **Perplexity** (no confirmed list endpoint).

## 3. Provider adapter interface (TypeScript sketch)

```ts
interface ProviderAdapter {
  id: string;                 // "openai", "anthropic", "gemini", "nvidia", ...
  displayName: string;
  keyPrefixes: string[];      // for auto-detect, may be empty
  validate(key: string): Promise<ValidationResult>;
}

interface ValidationResult {
  valid: boolean;
  models: { id: string; label?: string }[];
  error?: { code: string; message: string };
  raw?: unknown;              // last raw response, for debugging in a dev panel
}
```

Each provider is a small, independently testable module implementing this interface. Adding a new provider later is additive — no changes to the popup UI or storage layer.

## 4. Manifest V3 structure

```json
{
  "manifest_version": 3,
  "name": "KeyStinger",
  "action": { "default_popup": "index.html" },
  "permissions": ["storage"],
  "host_permissions": [
    "https://api.openai.com/*",
    "https://api.anthropic.com/*",
    "https://generativelanguage.googleapis.com/*",
    "https://integrate.api.nvidia.com/*"
  ],
  "optional_host_permissions": [
    "https://api.mistral.ai/*",
    "https://api.groq.com/*",
    "https://api.x.ai/*",
    "https://api.cohere.com/*",
    "https://api.perplexity.ai/*",
    "https://api.deepseek.com/*",
    "https://api.together.xyz/*",
    "https://openrouter.ai/*"
  ]
}
```

Requesting the long tail of providers as `optional_host_permissions` (granted at runtime, only when the user actually selects that provider) keeps the Chrome Web Store review footprint small and matches the principle of least privilege.

## 5. Security & data handling

- Keys are encrypted client-side with **WebCrypto AES-GCM** before being written to `chrome.storage.local`; the encryption key is derived and held only in memory / a non-exported CryptoKey, never written to disk in plaintext.
- **No telemetry on key values, ever.** If any analytics are added later (e.g., "validation succeeded" counts), events must carry provider name + boolean result only — never the key, never the raw response body.
- All provider calls use HTTPS only; no `http://` fallback.
- Because `host_permissions` scope network access to the extension's own contexts, page scripts on visited websites cannot read or intercept these requests.
- Clear, one-click "delete key" and a "wipe all data" action in settings, satisfying basic data-minimization expectations for a Chrome Web Store listing that handles credentials.

## 6. UI/UX requirements (minimalist, per product philosophy)

- Single popup, no multi-page onboarding wizard.
- Primary flow fits above the fold: provider dropdown → key input → Validate button → result.
- Model list renders as a searchable, scrollable list once results return (some providers return 100+ models — see OpenAI, OpenRouter).
- Status badges use color + icon (not color alone) for accessibility.
- Saved-keys list is a secondary view, not the default landing screen — validation-first, vault-second.

## 7. Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React + TypeScript | Matches existing stack conventions across other projects |
| Build | Vite + CRXJS plugin | Fast MV3-aware HMR |
| Styling | Tailwind CSS | Minimal, utility-first, keeps popup bundle small |
| Storage | `chrome.storage.local` + WebCrypto | No cloud dependency for MVP; instant, offline-capable |
| State | Lightweight (Zustand or React context) | Popup state is small; avoid over-engineering |
| Testing | Vitest + mocked fetch per adapter | Each provider adapter is unit-testable in isolation against fixture responses |

## 8. Error handling requirements

- Distinguish **401/403 (invalid or unauthorized key)** from **429 (rate limited)** from **5xx (provider outage)** — these need different user-facing messages ("key is bad" vs "try again in a moment" vs "provider is down, not your key").
- Timeout every validation call (e.g., 8s) with a clear "request timed out" state rather than an infinite spinner.
- Network/CORS failures should surface a specific message pointing at the optional-permission grant flow, since a missing `host_permissions` grant is a likely first-run failure mode.

## 9. Open questions to resolve during build

1. **Perplexity**: confirm whether a first-party list-models endpoint exists at build time; if not, ship a maintained static fallback list with a "last verified" date shown in the UI.
2. **CORS on provider domains**: verify empirically for each provider that a direct browser `fetch()` (not just server-side SDK calls) succeeds — MV3 `host_permissions` typically bypass page-CORS restrictions for the extension's own network requests, but provider-side CORS preflight behavior should still be smoke-tested per provider before launch.
3. **Gemini query-param vs header auth**: prefer the `x-goog-api-key` header over the `?key=` query param to avoid the key landing in browser network logs/history.
4. **Rate-limit friendliness**: consider caching a successful model list for N minutes so repeated UI opens don't re-hit the provider unnecessarily.

## 10. Custom provider support (paste-a-curl)

For providers not in the built-in matrix (self-hosted vLLM/Ollama/LM Studio endpoints, internal company gateways, niche vendors like Edgefield-style resellers, Azure OpenAI deployments, etc.), the user can define a **custom provider** by pasting a curl command copied straight from that provider's own docs or from their browser's DevTools ("Copy as cURL").

**Parsing approach**
- Use a client-side curl-parsing library (e.g., `curlconverter`, which ships a pure-JS parser with no native/shell dependency and runs entirely in-browser — safe for a service-worker/popup context) to extract: URL, HTTP method, headers, and body.
- Never execute the pasted curl as a shell command — always parse-then-`fetch()`. The extension must treat curl text as **untrusted input to a parser**, not as an executable string, to avoid any command-injection-style risk inside the extension's own context.
- After parsing, show the user an editable, structured preview (method / URL / headers table / body) *before* saving, so they can confirm what will actually be sent — this also lets them redact anything unwanted from a pasted-from-DevTools command (e.g., cookies that shouldn't be persisted).

**Custom provider record shape**
```ts
interface CustomProvider {
  id: string;                 // user-defined slug
  label: string;               // display name, e.g. "My Ollama box"
  baseUrl: string;
  validateMethod: "GET" | "POST";
  validatePath: string;        // e.g. "/v1/models" or "/health"
  headers: Record<string, string>;   // key placeholder swapped in at call time
  modelsResponsePath?: string; // JSONPath-ish hint for where the model array lives, e.g. "data" or "models"
  authHeaderName?: string;     // which header field holds the "key" for future swap-in
}
```
- If the pasted curl's response doesn't cleanly map to a `data[]`/`models[]` array, fall back to a raw JSON viewer so the user can still confirm the endpoint responded successfully, even without a clean model picker.
- Store custom providers the same way as built-in ones (encrypted local storage) — a custom provider definition is treated with the same sensitivity as a key, since headers may embed a secret directly (e.g. `Authorization: Bearer sk-xxxxx` pasted inline rather than templated).
- Add `host_permissions`/`optional_host_permissions` dynamically via `chrome.permissions.request()` for the custom base URL's origin at the moment the user saves it — MV3 requires this to be user-gesture-triggered, so it fits naturally right after the "confirm and save" click.

**Safety guardrails**
- Warn (non-blocking) if the pasted curl targets a non-HTTPS URL.
- Strip and warn about any `-o`/`--output`, `--data-binary @file`, or shell substitution (`$(...)`) syntax the parser can't safely represent as a `fetch()` call — these should be rejected rather than silently dropped.
- Cap response size read into the popup (e.g., 2MB) to avoid a misconfigured endpoint freezing the UI.

## 11. Request/response inspector

Every call the extension makes — built-in provider validation, custom-provider validation, or a custom ad-hoc request — should be captured and made inspectable, not just reduced to a pass/fail badge.

**What's captured per call**
```ts
interface CapturedExchange {
  id: string;
  timestamp: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;   // with the key value masked by default (see below)
    body?: string;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;              // raw text; pretty-print as JSON when possible
    durationMs: number;
  };
}
```

**UX**
- Collapsed by default under each validation result: a "View request/response" disclosure toggle keeps the primary flow uncluttered (matches the minimalist UI principle).
- Request headers mask the actual key value by default (e.g., `Authorization: Bearer sk-••••1234`) with a click-to-reveal toggle — this prevents the key from being casually shoulder-surfed or screenshotted while still letting the user confirm the header is well-formed.
- "Copy request" / "Copy response" / "Copy both as curl" buttons — the last one is the inverse of the custom-provider curl parser (structured request → curl text), useful for pasting into a bug report or teammate message.
- Body is pretty-printed when it's valid JSON, raw text otherwise.
- Keep only the last N (e.g., 20) captured exchanges in memory/session storage — this is a debugging aid, not a permanent audit log, and shouldn't silently grow local storage over time with sensitive header data.

## 13. Custom request sender

A free-form request builder, separate from both the "validate a known provider key" flow and the "paste a curl to define a reusable custom provider" flow. This is the ad-hoc, one-off version: pick a method, type a URL, add headers/body, hit send, inspect the result — closer to a minimal in-popup Postman than a saved provider.

**Scope**
- Fields: method (GET/POST/PUT/PATCH/DELETE), URL, headers (key/value rows), body (raw text, JSON-aware editor).
- Reuses the same `CapturedExchange` capture/display described in §11 — no separate inspector UI needed.
- Optional: "Save as custom provider" button on a successful send, which hands the composed request off into the §10 custom-provider flow rather than duplicating that logic.

**Safety guardrails (important — this is the most open-ended surface in the extension)**
- Require `chrome.permissions.request()` for the target origin before the first send to that origin, triggered from the send-button click (user gesture) — same pattern as §10.
- Show a lightweight one-time confirmation the first time a user sends to a *new* origin: "This will send a request directly from your browser to `<origin>`. Continue?" — keeps the user deliberately in the loop, since this feature can hit arbitrary domains, not just AI providers.
- Cap response size read into the popup (2MB, same as §10) and apply the same 8s timeout as validation calls (§8).
- This feature must never be used by the extension itself to call out anywhere automatically — it only fires on an explicit user click, with the exact request the user composed. No background/scheduled use of arbitrary custom requests.
- No feature flags or license checks gate this — per PRD §7, everything ships free.

## 14. What else could be added (research notes, beyond MVP)

- **Cost/usage visibility**: a few providers (e.g., OpenAI's usage endpoints, org-admin-scoped) expose spend data via separate, more sensitive admin-key endpoints — this would need a different (higher-privilege) key type than the inference key, so scope carefully if pursued.
- **Key rotation reminders**: combine with the scheduled re-check (PRD §could-have) to nudge users when a key hasn't been rotated in N months.
- **Latency/health ping**: alongside "is it valid," show a rough round-trip latency for the validation call as a lightweight signal of provider region/performance.
- **Import from `.env`**: parse a pasted `.env` file client-side and auto-populate/validate all recognized `*_API_KEY` variables in one batch — high-leverage feature for developers who already keep keys in `.env`.
- **Team vault (later, out of MVP scope)**: if there's demand down the line, encrypted sync across a user's own devices (still not server-readable) rather than a shared-team model, to preserve the "we never see your key" trust position. Not planned near-term.

## 15. Broader utility/tool surface (turning this into a general-purpose dev toolbox)

Once the validation core exists, the same popup shell and adapter pattern can host several adjacent, low-effort-to-add utilities that fit a "developer's daily AI toolbelt" positioning rather than a single-purpose validator:

- **Token counter / cost estimator**: paste text, pick a model, see token count (via `tiktoken`-style client-side tokenizers for OpenAI-family models, and provider-published tokenizer rules for others) and an estimated cost using each provider's published per-token pricing.
- **Test-prompt mode**: a "send a test prompt" mode (opt-in, clearly separate from validation) that fires one real completion call and shows raw latency, headers, and response — a natural extension of the request/response inspector (§11) and custom request sender (§13) once a key is validated.
- **Diff/compare mode**: send the same short prompt to two or three selected models side-by-side to eyeball latency and output differences before committing to one in code.
- **Right-click context menu integration**: highlight an API key–looking string on any webpage (e.g., in a README or Slack message you're viewing) and get a "Validate with KeyStinger" context-menu action.
- **Environment variable export**: generate a ready-to-paste `.env` block, Vercel/Netlify env-var JSON, or GitHub Actions secrets snippet from the saved vault — directly useful for a Vercel-monorepo workflow.
- **Rate-limit header decoder**: surface `x-ratelimit-*` style response headers in plain language ("You have 42 requests left this minute") whenever a validation call happens to return them.
- **Model changelog watcher**: since the list-models call is already being made, diff it against the last saved snapshot and flag "3 new models available on your OpenAI key since last check" — a nice low-cost engagement hook.
- **Multi-key load-balancer config generator**: for users with several keys on the same provider (e.g., to spread rate limits), generate a config snippet for round-robin/fallback key usage in common frameworks.
- **Webhook/status page shortcuts**: quick links to each provider's live status page (already public) surfaced next to a failed validation, so a 5xx immediately offers "check OpenAI status" instead of leaving the user guessing whether it's their key or the provider.
- **CLI companion (later)**: a small companion npm package that reads the same encrypted vault format, letting the same "vault" back both the extension and local dev scripts — reinforces the utility-tool positioning beyond just the browser.

Per PRD §7, the whole product is free for now — none of this list is planned as paywalled. Treat this section as a backlog of "nice to have next," not a monetization roadmap.
