# KeyStinger — Chrome Web Store Publishing Package & Checklist

Use this document to quickly fill in all required fields when submitting KeyStinger to the **Chrome Web Store Developer Dashboard**.

---

## 📝 1. Store Listing Information

### Extension Title
`KeyStinger — AI API Key Vault & Developer Toolbelt`

### Summary / Short Description (Max 132 Characters)
`Privacy-first AI API key validator, live model discovery, traffic inspector, token counter, batch .env importer, and toolbelt.`

### Category
`Developer Tools`

### Official Website / Privacy Policy URL
`https://himanxusharma.github.io/keystinger/privacy.html` *(or link to your GitHub Pages `privacy.html`)*

---

## 📄 2. Detailed Store Description (Copy & Paste)

```markdown
KeyStinger is an open-source, privacy-first developer toolbelt for validating, discovering, and inspecting AI API key credentials across 12+ top AI providers.

⚡ KEY FEATURES

• Instant Multi-Provider Key Validation: Test API keys for OpenAI, Anthropic (Claude), Google Gemini, NVIDIA NIM, Mistral, Groq, xAI (Grok), Cohere, Perplexity, DeepSeek, Together AI, and OpenRouter in 1 click.
• Auto-Detect Key Prefixes: Smart auto-detection for sk-proj-, sk-ant-, nvapi-, AIza, gsk_, and pplx- prefixes.
• AES-256 WebCrypto Local Encryption: Credentials saved to chrome.storage.local are encrypted with 256-bit WebCrypto AES-GCM algorithms.
• 100% On-Device & Zero-Backend Guarantee: Direct browser requests to official provider endpoints. Zero cloud proxy, zero tracking scripts, zero telemetry.
• Test-Prompt Inference Sandbox: Fire 1-sentence test completion prompts directly inside the popup to verify live inference quota and measure real round-trip latency (ms).
• Batch .env File Importer: Paste .env strings, batch-validate all keys, and save live keys to your vault in 1 click.
• Free Tier & Limits Directory: Built-in guide highlighting providers offering 100% free API key tiers (Gemini, Groq, NVIDIA, OpenRouter).
• SDK Code Generators: Multi-language code snippets for cURL, JS Fetch, Node.js SDK, and Python SDK.
• Developer Toolbelt: Token counter & cost calculator, .env exporter, side-by-side model diffing, and multi-key load balancer code generators for Node.js and Python.
```

---

## 🔒 3. Single-Purpose & Privacy Justifications

### Single-Purpose Description
`KeyStinger serves the single purpose of providing developers with a privacy-first local utility to validate AI API key credentials and inspect API request traffic.`

### Permission Justification Statements

#### 1. `storage`
`Required to persist WebCrypto AES-GCM 256-bit encrypted API key credentials locally on the user's disk (chrome.storage.local).`

#### 2. `contextMenus`
`Allows users to right-click highlighted API key text on any webpage to validate credentials directly with KeyStinger.`

#### 3. `alarms`
`Registers a background alarm (chrome.alarms) for periodic health checks on saved credentials.`

#### 4. `host_permissions` (`https://api.openai.com/*`, `https://api.anthropic.com/*`, `https://generativelanguage.googleapis.com/*`...)
`Required to make direct client-side HTTP fetch() validation calls from the user's browser directly to official AI provider API endpoints without using any intermediate cloud proxy servers.`

---

## 🖼️ 4. Graphic Assets Specifications Checklist

Before submitting, upload the following graphic assets in the Web Store Console:

- [x] **Store Icon**: `128x128 PNG` (`public/icons/icon-128.png` - Green square with black center dot)
- [ ] **Store Screenshot 1**: `1280x800` (Main Key Validation view)
- [ ] **Store Screenshot 2**: `1280x800` (Encrypted Key Vault view)
- [ ] **Store Screenshot 3**: `1280x800` (Traffic Inspector & SDK Code Generator)
- [ ] **Store Screenshot 4**: `1280x800` (Token Counter & Developer Tools view)
- [ ] **Small Promotional Tile**: `440x280 PNG`
- [ ] **Marquee Promotional Tile**: `1400x560 PNG`

---

## 🕵️ 5. Reviewer Testing Instructions

When prompted by the Chrome Web Store review team for testing notes:

```
Testing Instructions for Chrome Web Store Reviewers:

KeyStinger validates AI API key credentials by calling official public provider endpoints (e.g. GET https://api.openai.com/v1/models with authorization headers).

To test KeyStinger:
1. Open the KeyStinger extension popup.
2. Select target provider (e.g. Google Gemini or OpenAI).
3. Paste a test API key (or use Google Gemini's free API key from https://aistudio.google.com/app/apikey).
4. Click "Validate & Discover Models". KeyStinger will execute a direct fetch() call and display verified model entitlements.
5. All credentials are encrypted locally on disk via WebCrypto AES-256. KeyStinger uses zero backend servers.
```
