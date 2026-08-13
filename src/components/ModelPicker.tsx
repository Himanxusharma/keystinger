import React, { useState } from 'react';
import { Search, Code2, Copy, Check, Sparkles, Layers } from 'lucide-react';
import { ModelInfo } from '../types';

interface ModelPickerProps {
  models: ModelInfo[];
  providerId: string;
  apiKey?: string;
}

export const ModelPicker: React.FC<ModelPickerProps> = ({ models, providerId, apiKey = 'sk-...' }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id || '');
  const [snippetLanguage, setSnippetLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!models || models.length === 0) return null;

  const filteredModels = models.filter((m) =>
    m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];

  const generateSnippet = (): string => {
    const targetModel = activeModel.id;
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

    if (snippetLanguage === 'javascript') {
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
        <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
          <Sparkles size={10} /> Live Verified
        </span>
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
            <span>Code Snippet Generator</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            {(['curl', 'javascript', 'python'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSnippetLanguage(lang)}
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded transition-colors ${
                  snippetLanguage === lang
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'javascript' ? 'JS' : lang}
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
    </div>
  );
};
