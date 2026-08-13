---
name: keystinger-extension
description: Use this skill whenever building, extending, or debugging the "KeyStinger" Chrome extension — the multi-provider AI API key validator/model-picker tool. Trigger on any mention of validating AI provider keys, listing available models for a key, adding a new AI provider adapter, parsing a pasted curl command into a custom provider, or any Chrome MV3 popup/service-worker work tied to this project. Also trigger for questions like "which endpoint validates an OpenAI/Anthropic/Gemini/NVIDIA key" or "how should I store this key securely" within this project's context. Always consult this before writing a new provider adapter or touching key storage/security code, since it encodes provider-specific auth quirks and security rules that are easy to get wrong from memory alone.
---

# KeyStinger — Extension Build Skill

Encodes the architecture, provider API conventions, and security rules for the KeyStinger Chrome extension, so implementation stays consistent with `README.md`, `PRD.md`, and `TRD.md` across sessions. Read those three files first if present in the repo — this skill is the condensed, action-oriented version for day-to-day coding.

## Core principle

This extension **never proxies inference calls and never lets a key leave the browser**. Every provider call — validation, list-models, or a custom-provider test — goes directly from the extension's service worker/popup to the provider's own API via `fetch()`. If a task implies routing a key through any backend Himxu controls, stop and flag it — that breaks the product's core trust promise.

## Provider adapter pattern

Almost every provider is OpenAI-compatible: `GET /v1/models` (or `/models`) with `Authorization: Bearer <key>`, response shape `{ data: [...] }`. Implement **one generic adapter** for these and reuse it via config (base URL + key prefix only):

- OpenAI, NVIDIA NIM, Mistral, Groq, xAI, DeepSeek, Together AI, OpenRouter

Three providers need **bespoke adapters** — do not try to force them into the generic shape:

| Provider | Deviation |
|---|---|
| Anthropic | `x-api-key` header (not `Bearer`), plus required `anthropic-version` header |
| Gemini | `x-goog-api-key` header, response field is `models[]` not `data[]`, model IDs are prefixed `models/...` |
| Perplexity | No confirmed public list-models endpoint as of last research — verify current docs before assuming one exists; fall back to a static, dated model list if still absent |

When adding a new provider: check its docs for the list-models endpoint and auth header first. Default assumption is "OpenAI-compatible" — only write a custom adapter if it demonstrably deviates.

```ts
interface ProviderAdapter {
  id: string;
  displayName: string;
  keyPrefixes: string[];
  validate(key: string): Promise<ValidationResult>;
}
interface ValidationResult {
  valid: boolean;
  models: { id: string; label?: string }[];
  error?: { code: string; message: string };
}
```

## Pricing model — no gating

**The whole product is free right now — no Pro tier exists.** Do not add license checks, tier flags, feature limits, or paywall UI anywhere, including for the request/response inspector or custom request sender below. If a task description implies gating a feature, flag it rather than implementing it — this contradicts current product decisions.

## Request/response inspector & custom request sender

Every call the extension makes — provider validation, custom-provider validation, or an ad-hoc custom request — should be captured as a `CapturedExchange` (request: method/url/headers/body; response: status/headers/body/duration) and made inspectable via a collapsed-by-default "View request/response" toggle. Mask the key value in displayed headers by default (`Bearer sk-••••1234`) with a click-to-reveal. Offer copy-to-clipboard for request, response, or both-as-curl. Keep only the last ~20 captured exchanges — this is a debugging aid, not a permanent log.

The **custom request sender** is a separate, free-form builder (method/URL/headers/body → send → inspect) for one-off requests to *any* URL, distinct from both provider validation and the saved custom-provider flow. Because it can hit arbitrary origins:
- Require `chrome.permissions.request()` for a new origin before first send, from the send-click user gesture.
- Show a one-time confirmation dialog the first time a user sends to a new origin.
- Never let this fire automatically/in the background — user-click only, every time.

## Custom provider (paste-a-curl) rules

When implementing or touching the custom-provider flow:

1. **Parse, never execute.** Pasted curl text is untrusted input to a parser (e.g. `curlconverter`, which runs pure client-side JS with no shell dependency) — it must become a structured `{ url, method, headers, body }` object, never be run as a shell command.
2. **Always show an editable preview** (method / URL / headers table / body) before saving, so the user confirms exactly what will be sent.
3. **Reject, don't silently mangle**, curl syntax that can't be safely represented as a `fetch()` call: shell substitution (`$(...)`), `-o`/`--output` file writes, `--data-binary @file`. Warn on non-HTTPS URLs.
4. Custom provider records are stored encrypted, same as keys — headers frequently embed a raw secret inline rather than templated.
5. Request the custom origin's `host_permissions` via `chrome.permissions.request()` at save time, inside the user's save-click gesture (MV3 requires the user-gesture context).

## Security rules (non-negotiable)

- Keys and custom-provider header blobs are encrypted client-side (WebCrypto AES-GCM) before writing to `chrome.storage.local`. Never write plaintext keys to disk.
- No analytics/telemetry ever includes a key value or a raw response body — provider name + boolean result only, if analytics exist at all.
- HTTPS only, no `http://` fallback, anywhere a key or custom endpoint is involved.
- Prefer header-based auth over query-param auth when a provider supports both (e.g., Gemini's `x-goog-api-key` over `?key=`), to keep keys out of browser history/network logs.
- Manifest permissions: keep the top 3-4 providers in required `host_permissions`; put the long tail (and all custom providers) in `optional_host_permissions`, requested at runtime — minimizes Chrome Web Store review friction and matches least-privilege.

## Error handling convention

Distinguish and message differently for:
- `401/403` → "this key is invalid/unauthorized" (key problem)
- `429` → "rate limited, try again shortly" (not a key problem)
- `5xx` / network failure → "provider is down" + surface a link to that provider's public status page
- Timeout (8s default) → explicit "request timed out" state, never an infinite spinner

## UI conventions

- Single popup, no multi-step onboarding. Primary flow (provider → key → Validate → result) fits above the fold at ~400x600px.
- Status uses color + icon together, never color alone.
- Model lists can be large (100+ on OpenAI/OpenRouter) — always render as searchable/scrollable, never a flat unsearchable list.

## Where to look for more detail

- `README.md` — product pitch and quick start
- `PRD.md` — scope (MoSCoW), personas, monetization tiers (free = validate only; Pro = full toolbelt), roadmap
- `TRD.md` — full provider endpoint/header matrix (§2), custom-provider spec (§10), and the broader toolbelt feature backlog (§12: token counter, request inspector, model diff, `.env` export, changelog watcher, etc.) for anything beyond core validation
