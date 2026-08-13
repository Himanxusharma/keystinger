import React, { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { BUILTIN_PROVIDERS } from '../adapters/registry';

export const LoadBalancerGenerator: React.FC = () => {
  const [providerId, setProviderId] = useState<string>('openai');
  const [lang, setLang] = useState<'node' | 'python'>('node');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const provider = BUILTIN_PROVIDERS.find((p) => p.id === providerId) || BUILTIN_PROVIDERS[0];

  const generateLoadBalancerCode = (): string => {
    if (lang === 'node') {
      return `// KeyStinger Round-Robin Key Load Balancer (${provider.displayName})
const keys = [
  process.env.${provider.displayName.toUpperCase().replace(/[^A-Z]/g, '_')}_KEY_1,
  process.env.${provider.displayName.toUpperCase().replace(/[^A-Z]/g, '_')}_KEY_2,
];
let keyIndex = 0;

export function getNextKey() {
  const key = keys[keyIndex];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

export async function fetchWithFallback(url, options = {}) {
  let lastError;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = getNextKey();
    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...options.headers, 'Authorization': \`Bearer \${key}\` }
      });
      if (res.status === 429 || res.status >= 500) continue;
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("All rotated keys failed.");
}`;
    }

    return `# KeyStinger Round-Robin Key Load Balancer (${provider.displayName})
import os
import requests

KEYS = [
    os.getenv("${provider.displayName.toUpperCase().replace(/[^A-Z]/g, '_')}_KEY_1"),
    os.getenv("${provider.displayName.toUpperCase().replace(/[^A-Z]/g, '_')}_KEY_2"),
]
_key_index = 0

def get_next_key():
    global _key_index
    key = KEYS[_key_index]
    _key_index = (_key_index + 1) % len(KEYS)
    return key

def fetch_with_fallback(url, payload):
    for _ in range(len(KEYS)):
        key = get_next_key()
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code not in (429, 500, 502, 503):
            return res.json()
    raise RuntimeError("All rotated keys failed.")`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateLoadBalancerCode());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="text-amber-600" size={18} />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Multi-Key Load Balancer Generator
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {(['node', 'python'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors uppercase ${
                lang === l ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Provider</label>
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-900"
        >
          {BUILTIN_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-48 custom-scrollbar shadow-inner">
          <code>{generateLoadBalancerCode()}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 p-1.5 rounded-md text-xs transition-all active:scale-95 flex items-center gap-1"
          title="Copy snippet"
        >
          {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
};
