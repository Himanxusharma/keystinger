# Product Requirements Document — KeyStinger

**Version:** 1.0
**Status:** Draft for build
**Owner:** Himxu

---

## 1. Problem statement

Developers working with multiple AI providers accumulate API keys across OpenAI, Anthropic, Gemini, NVIDIA, and a long tail of others. There is no fast, trustworthy way to answer two everyday questions:

1. "Is this key still valid?" (keys get revoked, rotated, rate-limited, or billing lapses silently)
2. "What models can this specific key actually call?" (access varies by tier, region, org, and provider program)

Today, answering this means opening each provider's dashboard separately, or writing a throwaway curl command. That friction is exactly what a Chrome extension can remove — validate in-context, in seconds, without leaving the browser.

## 2. Goals

- **Primary:** Let a user paste any supported provider's API key and get an accurate valid/invalid result plus the live list of accessible models in under 2 seconds.
- **Secondary:** Let the user save keys locally (encrypted) and re-check them on demand or on a schedule, turning the extension into a lightweight "key health" utility.
- **Transparency goal:** Never be a black box — every validation and custom request shows the user the exact raw request sent and raw response received, and lets them fire their own ad-hoc requests, not just the built-in validation call.
- **Business goal:** Ship as a **fully free** tool for now (see §7) — the priority is adoption and utility, not monetization. No Pro tier, no paywalled features, no feature gating.

## 3. Non-goals (MVP)

- Not a secrets manager / password vault replacement (no team sharing, no SSO, no cloud sync in MVP).
- Not a proxy or API gateway — the extension never relays actual inference requests, only validation/list-models calls.
- Not responsible for billing/usage/cost data in v1 (flagged as a fast-follow, see §8).

## 4. Target users / personas

| Persona | Need |
|---|---|
| **Indie AI builder** (e.g., building SaaS on top of multiple LLMs) | Quickly confirm a new key works before wiring it into code; avoid burning a debug session on a bad key |
| **Agency / freelance dev** | Manages client-provided keys across projects; needs to verify a client's key is live and see its tier/model access before starting work |
| **Internal tools / platform team** | Periodically audits which of the org's stored keys are still valid, ahead of a key-rotation policy |

## 5. User stories

- As a user, I can select a provider from a dropdown (or paste a key and have the provider auto-detected from its prefix, e.g. `sk-`, `sk-ant-`, `nvapi-`).
- As a user, I can paste a key and click **Validate**, and within a couple seconds see a clear ✅/❌ status.
- As a user, if the key is valid, I see the real list of models that key can access, not a generic static list.
- As a user, I can pick a model from that list and copy a ready-to-use code snippet (curl / JS / Python) pre-filled with the provider's endpoint and that model ID.
- As a user, I can save a validated key locally under a nickname (e.g., "Client X — OpenAI prod") so I don't have to re-paste it every time.
- As a user, I can see all my saved keys in one list with their last-checked status, and re-check any of them with one click.
- As a user, I can delete a saved key at any time, and know it is removed from local storage immediately.
- As a user, I never worry about my key leaving my machine — validation calls go straight from my browser to the provider's official API.
- As a user, if my provider isn't in the built-in list (self-hosted model, internal gateway, niche reseller), I can paste a curl command copied from that provider's docs or from DevTools, and the extension parses it into a reusable "custom provider" I can validate and save just like a built-in one.
- As a user, before a pasted curl command is saved, I can see exactly what URL/headers/body it will send, so I'm never surprised by what leaves my browser.
- As a user, I can view the full raw request (method, URL, headers, body) and raw response (status, headers, body) for any validation call I've just made, so I can debug an integration issue without reaching for Postman or DevTools.
- As a user, I can compose and send my own custom request from scratch — any URL, method, headers, and body I choose — separate from the built-in provider validation flow, and see the raw request/response for it too.
- As a user, I can copy the raw request or response (or both) to my clipboard, so I can paste it into a bug report, a teammate's Slack message, or my own notes.

## 6. Feature prioritization (MoSCoW)

**Must have (MVP)**
- Provider selector covering OpenAI, Anthropic, Google Gemini, NVIDIA NIM (top 4, highest usage per Himxu's stack)
- Key input + validate action calling each provider's real list-models endpoint
- Model list display + model picker
- Local encrypted storage of saved keys (`chrome.storage.local` + WebCrypto AES-GCM)
- Minimal, single-screen popup UI (no onboarding friction)
- **Request/response inspector** — every validation call shows its raw request and raw response (status, headers, body) in an expandable panel
- **Custom request sender** — a free-form mode to send any URL/method/headers/body and inspect the raw result, independent of the provider-validation flow

**Should have (v1.1)**
- Expand provider matrix to Mistral, Groq, xAI/Grok, Cohere, Perplexity, DeepSeek, Together AI, OpenRouter
- Auto-detect provider from key prefix
- Copy-paste code snippet generator (curl/JS/Python) per selected model
- Key health dashboard (all saved keys, last-checked timestamp, status badge)
- **Custom provider via pasted curl** — parse, preview, and save any provider not in the built-in matrix (see TRD §10)
- Copy raw request / raw response to clipboard; save a custom request as a reusable named snippet

**Could have (v1.2+)**
- Scheduled background re-validation (e.g., daily) with a badge/notification on the extension icon if a key goes invalid
- Per-key notes/tags and simple project grouping
- Export/import of the encrypted key vault (for moving between machines)
- Dark mode / theme toggle
- Additional toolbelt utilities — token counter/cost estimator, model diff/compare, right-click context-menu validation, `.env`/CI secrets export, model changelog watcher (full list in TRD §12)

**Won't have (explicitly out of scope for now)**
- Team/multi-user sharing of keys
- Actual inference / chat functionality inside the extension (the custom request sender can technically hit a completion endpoint if the user builds that request themselves, but the extension doesn't build a chat UI around it)
- Usage & cost tracking (requires provider billing APIs, which are inconsistent and often org-admin-only — see TRD open questions)

## 7. Monetization

**Fully free, no Pro tier, for now.** Every feature above — including the full provider matrix, custom-provider curl parsing, the request/response inspector, and the custom request sender — ships free with no gating or paywall. The near-term goal is adoption, trust, and utility, not revenue. Monetization (if pursued later) is deferred to a future decision point and is not reflected in scope, UI, or architecture today — no license-check code, no tier flags, no artificial limits should be built into v1.

Distribution is via a straightforward Chrome Web Store listing with a "verify keys instantly, see exactly what's sent" hook; the extension may also serve as a lightweight trust-builder / awareness surface for other Himxu products (EssmartCreator, meImposter) where users already work with AI keys.

## 8. Success metrics

- Time-to-first-validation after install (target: <30s from install to first successful check)
- % of validations that return a model list successfully (proxy for endpoint reliability across providers)
- Weekly active users re-checking saved keys (retention signal for the utility use case)
- Usage of the custom request sender as a signal of "toolbelt" adoption beyond simple validation

## 9. Risks & open questions

- **CORS**: some providers may not set permissive CORS headers for direct browser calls; MV3 extensions can use `host_permissions` to bypass page-level CORS restrictions for the extension's own requests — needs per-provider verification during build (see TRD §Open Questions).
- **Rate limits**: validation calls (even lightweight `GET /models`) count against a user's rate limit on some providers; needs sensible debounce/backoff.
- **Provider API drift**: model-list schemas and auth header conventions change over time (confirmed differences even between OpenAI, Anthropic, and Gemini today) — needs a provider-adapter pattern that isolates this churn (see TRD architecture).
- **Chrome Web Store review**: an extension that requests broad `host_permissions` to reach many third-party AI domains may draw extra scrutiny; scoping permissions per-provider (optional permissions requested on first use) mitigates this.
- **Custom request sender scope**: since this lets a user hit *any* URL from the extension, it needs a runtime-permission prompt (via `chrome.permissions.request()`) for arbitrary origins, plus clear in-UI framing that this is the user directing their own browser to make a request — not the extension calling out on its own initiative. See TRD §13 for the safety guardrails.

## 10. Roadmap sketch

| Phase | Scope |
|---|---|
| Phase 1 (MVP) | Must-haves above (including request/response inspector + custom request sender), 4 providers, Chrome Web Store submission — fully free |
| Phase 2 | Should-haves, provider matrix expansion, snippet generator, custom-provider curl parsing |
| Phase 3 | Could-haves, scheduled checks, additional toolbelt utilities |
| Phase 4 (exploratory) | Usage/cost visibility where provider APIs allow it; Firefox/Edge ports; revisit monetization only if/when it makes sense |
