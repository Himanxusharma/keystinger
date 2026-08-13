import React, { useState, useEffect } from 'react';
import { Search, Code2, Copy, Check, Sparkles, Layers } from 'lucide-react';
import { ModelInfo } from '../types';
import { TestPromptSandbox } from './TestPromptSandbox';

interface ModelPickerProps {
  models: ModelInfo[];
  providerId: string;
  apiKey?: string;
}

type SnippetLang = 'curl' | 'js_fetch' | 'node_sdk' | 'py_requests' | 'py_sdk';

export const ModelPicker: React.FC<ModelPickerProps> = ({ models, providerId, apiKey = 'sk-...' }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id || '');
  const [snippetLanguage, setSnippetLanguage] = useState<SnippetLang>('curl');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [newModelsCount, setNewModelsCount] = useState<number>(0);

  // Model Changelog Watcher logic
  useEffect(() => {
    if (!models || models.length === 0) return;

    const storageKey = `ks_model_snapshot_${providerId}`;
    let previousModelIds: string[] = [];

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          previousModelIds = JSON.parse(raw);
        } catch {
          previousModelIds = [];
        }
      }
    }

    const currentModelIds = models.map((m) => m.id);

    if (previousModelIds.length > 0) {
      const newlyAdded = currentModelIds.filter((id) => !previousModelIds.includes(id));
      setNewModelsCount(newlyAdded.length);
    } else {
      setNewModelsCount(0);
    }

    // Update snapshot
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(currentModelIds));
    }
  }, [models, providerId]);

  if (!models || models.length === 0) return null;

  const filteredModels = models.filter((m) =>
    m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];

  const generateSnippet = (): string => {
    const targetModel = activeModel.id;

    // 1. cURL
    if (snippetLanguage === 'curl') {
      if (providerId === 'anthropic') {
        return `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "${targetModel}",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello Claude"}]
  }'`;
      }
      if (providerId === 'gemini') {
        return `curl https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent \\
  -H "x-goog-api-key: ${apiKey}" \\
  -H "content-type: application/json" \\
  -d '{
    "contents": [{"parts":[{"text": "Hello Gemini"}]}]
  }'`;
      }
      return `curl https://api.openai.com/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${targetModel}",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`;
    }

    // 2. JavaScript (Fetch)
    if (snippetLanguage === 'js_fetch') {
      if (providerId === 'anthropic') {
        return `const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': '${apiKey}',
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    model: '${targetModel}',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello Claude' }]
  })
});
const data = await response.json();
console.log(data);`;
      }
      return `const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: '${targetModel}',
    messages: [{ role: 'user', content: 'Hello' }]
  })
});
const data = await response.json();
console.log(data);`;
    }

    // 3. Node.js (Official SDK)
    if (snippetLanguage === 'node_sdk') {
      if (providerId === 'anthropic') {
        return `import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: '${apiKey}' });
const message = await anthropic.messages.create({
  model: '${targetModel}',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello Claude' }],
});
console.log(message.content);`;
      }
      if (providerId === 'gemini') {
        return `import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('${apiKey}');
const model = genAI.getGenerativeModel({ model: '${targetModel}' });
const result = await model.generateContent("Hello Gemini");
console.log(result.response.text());`;
      }
      return `import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: '${apiKey}' });
const response = await openai.chat.completions.create({
  model: '${targetModel}',
  messages: [{ role: 'user', content: 'Hello' }],
});
console.log(response.choices[0].message);`;
    }

    // 4. Python (Requests)
    if (snippetLanguage === 'py_requests') {
      return `import requests

url = "https://api.openai.com/v1/chat/completions"
headers = {
    "Authorization": f"Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "model": "${targetModel}",
    "messages": [{"role": "user", "content": "Hello"}]
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`;
    }

    // 5. Python (Official SDK)
    if (providerId === 'anthropic') {
      return `import anthropic

client = anthropic.Anthropic(api_key="${apiKey}")
message = client.messages.create(
    model="${targetModel}",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello Claude"}]
)
print(message.content)`;
    }

    if (providerId === 'gemini') {
      return `import google.generativeai as genai

genai.configure(api_key="${apiKey}")
model = genai.GenerativeModel('${targetModel}')
response = model.generate_content("Hello Gemini")
print(response.text)`;
    }

    return `from openai import OpenAI

client = OpenAI(api_key="${apiKey}")
response = client.chat.completions.create(
    model="${targetModel}",
    messages=[{"role": "user", "content": "Hello"}]
)
print(response.choices[0].message.content)`;
  };

  const handleCopyCode = () => {
    const code = generateSnippet();
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3.5 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Accessible Live Models ({models.length})
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {newModelsCount > 0 && (
            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
              ✨ {newModelsCount} new models!
            </span>
          )}
          <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
            <Sparkles size={10} /> Live Verified
          </span>
        </div>
      </div>

      {/* Model Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search models by ID or name..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>

      {/* Scrollable Model Picker List */}
      <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {filteredModels.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-3">No matching models found.</p>
        ) : (
          filteredModels.map((m) => {
            const isSelected = (selectedModelId || models[0]?.id) === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModelId(m.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center justify-between border ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold'
                    : 'bg-slate-950/40 border-transparent text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="truncate">{m.id}</span>
                {m.contextWindow && (
                  <span className="text-[10px] text-slate-500 shrink-0 font-sans ml-2">
                    {Math.round(m.contextWindow / 1000)}k ctx
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Code Snippet Generator */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Code2 size={14} className="text-amber-400" />
            <span>SDK Code Generator</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            {(
              [
                { id: 'curl', label: 'cURL' },
                { id: 'js_fetch', label: 'JS' },
                { id: 'node_sdk', label: 'Node SDK' },
                { id: 'py_sdk', label: 'Py SDK' }
              ] as const
            ).map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSnippetLanguage(lang.id as any)}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                  snippetLanguage === lang.id
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-32 custom-scrollbar">
            <code>{generateSnippet()}</code>
          </pre>
          <button
            onClick={handleCopyCode}
            className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 p-1.5 rounded-md text-xs transition-all active:scale-95 flex items-center gap-1"
            title="Copy snippet"
          >
            {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Live Inference Sandbox */}
      <TestPromptSandbox
        providerId={providerId}
        modelId={activeModel.id}
        apiKey={apiKey}
      />
    </div>
  );
};
