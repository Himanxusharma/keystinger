# KeyStinger — Privacy Policy

**Effective Date**: August 13, 2026  
**Product Name**: KeyStinger (`keystinger`)  
**Type**: Chrome Browser Extension (Manifest V3)  

---

## 1. Overview & Privacy Commitment

KeyStinger is an open-source, privacy-first Chrome Extension engineered for software developers, prompt engineers, and security auditors to validate AI API key credentials and inspect HTTP request traffic.

**Our Core Privacy Promise**: KeyStinger operates **100% on your local device**. We do NOT operate intermediate cloud backend proxy servers, we do NOT collect personal data, and we do NOT track user behavior or send telemetry.

---

## 2. Information We Collect and Process

### A. API Key Credentials & Custom Gateways
- **Local Encryption**: API keys provided by the user are encrypted locally on the device using 256-bit WebCrypto AES-GCM algorithms before being written to `chrome.storage.local`.
- **Zero Cloud Storage**: Your API keys remain strictly on your local machine and are NEVER transmitted to KeyStinger servers (we have zero servers).

### B. Direct API Communications
- All API validation calls and request executions are sent **directly from your browser** (`fetch()`) to the specific official third-party AI provider endpoints chosen by the user (e.g. `api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com`, `api.groq.com`).
- KeyStinger never acts as a proxy middleman.

### C. Analytics and Telemetry
- **Zero Analytics**: We do NOT use Google Analytics, Mixpanel, Segment, or any tracking scripts.
- **Zero Cookies**: KeyStinger sets zero tracking cookies.

---

## 3. Chrome Extension Permissions Justification

| Permission | Purpose & Justification |
|---|---|
| `storage` | Required to store WebCrypto AES-GCM encrypted API key records locally on disk (`chrome.storage.local`). |
| `contextMenus` | Allows right-clicking selected API key text on any webpage to validate credentials with KeyStinger. |
| `alarms` | Registers a background timer (`chrome.alarms`) for periodic health checks on saved credentials. |
| `host_permissions` | Enables direct client-side `fetch()` HTTP requests from the user's browser to official AI provider API endpoints. |

---

## 4. Third-Party Services

KeyStinger connects strictly to official AI provider endpoints selected explicitly by the user for validation and inference. Each provider is governed by its respective privacy policy:
- [OpenAI Privacy Policy](https://openai.com/privacy)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- [Google Privacy Policy](https://policies.google.com/privacy)
- [NVIDIA Privacy Policy](https://www.nvidia.com/en-us/about-nvidia/privacy-policy/)
- [Groq Privacy Policy](https://groq.com/privacy-policy/)

---

## 5. Data Security & Open Source Transparency

KeyStinger is 100% open source under the **MIT License**. The codebase can be audited by anyone at any time to verify that zero credential data leaves the local device.

---

## 6. Contact & Data Controller Information

If you have questions regarding this Privacy Policy or KeyStinger's security model, please contact:
- **GitHub Repository**: [https://github.com/Himanxusharma/keystinger](https://github.com/Himanxusharma/keystinger)
- **Open Source Issue Tracker**: [https://github.com/Himanxusharma/keystinger/issues](https://github.com/Himanxusharma/keystinger/issues)
