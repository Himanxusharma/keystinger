import React, { useState } from 'react';
import { Columns, Sparkles, Layers } from 'lucide-react';
import { MODEL_PRICING_DATABASE, ModelPricing } from '../utils/pricing';

export const ModelCompare: React.FC = () => {
  const [modelAId, setModelAId] = useState<string>('gpt-4o');
  const [modelBId, setModelBId] = useState<string>('claude-3-5-sonnet-20241022');

  const modelA = MODEL_PRICING_DATABASE.find((m) => m.modelId === modelAId) || MODEL_PRICING_DATABASE[0];
  const modelB = MODEL_PRICING_DATABASE.find((m) => m.modelId === modelBId) || MODEL_PRICING_DATABASE[2];

  const getCurlSnippet = (m: ModelPricing) => {
    if (m.provider === 'Anthropic') {
      return `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: sk-ant-..." \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{"model":"${m.modelId}","messages":[]}'`;
    }
    if (m.provider === 'Google Gemini') {
      return `curl https://generativelanguage.googleapis.com/v1beta/models/${m.modelId}:generateContent \\
  -H "x-goog-api-key: AIza..."`;
    }
    return `curl https://api.openai.com/v1/chat/completions \\
  -H "Authorization: Bearer sk-..." \\
  -d '{"model":"${m.modelId}","messages":[]}'`;
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Columns className="text-amber-400" size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Side-by-Side Model Diff
          </h3>
        </div>
        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono flex items-center gap-1">
          <Sparkles size={10} /> Model Compare
        </span>
      </div>

      {/* Model Selectors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-slate-400 block mb-1">Model A</label>
          <select
            value={modelAId}
            onChange={(e) => setModelAId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
          >
            {MODEL_PRICING_DATABASE.map((m) => (
              <option key={m.modelId} value={m.modelId}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 block mb-1">Model B</label>
          <select
            value={modelBId}
            onChange={(e) => setModelBId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
          >
            {MODEL_PRICING_DATABASE.map((m) => (
              <option key={m.modelId} value={m.modelId}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
        {/* Model A Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="border-b border-slate-800 pb-1.5">
            <span className="text-[10px] text-amber-400 font-sans uppercase font-bold block">{modelA.provider}</span>
            <h4 className="font-bold text-white text-xs truncate">{modelA.displayName}</h4>
          </div>

          <div className="space-y-1 text-[11px]">
            <div>
              <span className="text-slate-500 font-sans block text-[10px]">Context Window</span>
              <span className="text-slate-200">{Math.round(modelA.contextWindow / 1000)}k tokens</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[10px]">Input Price</span>
              <span className="text-emerald-400">${modelA.inputCostPerMillion}/1M</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[10px]">Output Price</span>
              <span className="text-amber-400">${modelA.outputCostPerMillion}/1M</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 font-sans block mb-1">cURL Endpoint</span>
            <pre className="bg-slate-950 p-1.5 rounded text-[9px] text-slate-300 overflow-x-auto custom-scrollbar">
              <code>{getCurlSnippet(modelA)}</code>
            </pre>
          </div>
        </div>

        {/* Model B Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="border-b border-slate-800 pb-1.5">
            <span className="text-[10px] text-amber-400 font-sans uppercase font-bold block">{modelB.provider}</span>
            <h4 className="font-bold text-white text-xs truncate">{modelB.displayName}</h4>
          </div>

          <div className="space-y-1 text-[11px]">
            <div>
              <span className="text-slate-500 font-sans block text-[10px]">Context Window</span>
              <span className="text-slate-200">{Math.round(modelB.contextWindow / 1000)}k tokens</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[10px]">Input Price</span>
              <span className="text-emerald-400">${modelB.inputCostPerMillion}/1M</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[10px]">Output Price</span>
              <span className="text-amber-400">${modelB.outputCostPerMillion}/1M</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 font-sans block mb-1">cURL Endpoint</span>
            <pre className="bg-slate-950 p-1.5 rounded text-[9px] text-slate-300 overflow-x-auto custom-scrollbar">
              <code>{getCurlSnippet(modelB)}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
