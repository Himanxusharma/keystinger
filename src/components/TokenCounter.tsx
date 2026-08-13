import React, { useState } from 'react';
import { Calculator, DollarSign, Sparkles } from 'lucide-react';
import { MODEL_PRICING_DATABASE, estimateTokenCount, calculateEstimatedCost } from '../utils/pricing';

export const TokenCounter: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('gpt-4o');
  const [outputTokens, setOutputTokens] = useState<number>(500);

  const estimatedInputTokens = estimateTokenCount(inputText);
  const costCalculation = calculateEstimatedCost(selectedModelId, estimatedInputTokens, outputTokens);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="text-amber-600" size={18} />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Token Counter & Cost Estimator
          </h3>
        </div>
        <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
          <Sparkles size={10} /> Real-Time Math
        </span>
      </div>

      {/* Model Selector */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Model & Pricing Tier</label>
        <select
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 shadow-inner"
        >
          {MODEL_PRICING_DATABASE.map((m) => (
            <option key={m.modelId} value={m.modelId}>
              {m.displayName} ({m.provider}) — ${m.inputCostPerMillion}/1M in, ${m.outputCostPerMillion}/1M out
            </option>
          ))}
        </select>
      </div>

      {/* Text Area */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-bold text-slate-700">Prompt Text</label>
          <span className="text-[10px] font-mono text-amber-700 font-bold">
            ~{estimatedInputTokens} Input Tokens
          </span>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your prompt text or payload here to estimate token count and API cost..."
          rows={4}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 custom-scrollbar shadow-inner"
        />
      </div>

      {/* Expected Output Tokens Slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-bold text-slate-700">Expected Response Length</label>
          <span className="text-[10px] font-mono text-slate-600 font-bold">{outputTokens} Output Tokens</span>
        </div>
        <input
          type="range"
          min={50}
          max={4000}
          step={50}
          value={outputTokens}
          onChange={(e) => setOutputTokens(Number(e.target.value))}
          className="w-full accent-amber-500 bg-slate-200 rounded-lg cursor-pointer"
        />
      </div>

      {/* Cost Calculation Cards */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-center shadow-xs">
        <div>
          <span className="text-[10px] text-slate-500 block font-sans font-medium">Input Cost</span>
          <span className="text-xs font-bold text-slate-800">
            ${costCalculation.inputCost.toFixed(5)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 block font-sans font-medium">Output Cost</span>
          <span className="text-xs font-bold text-slate-800">
            ${costCalculation.outputCost.toFixed(5)}
          </span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-1">
          <span className="text-[10px] text-amber-800 block font-sans font-bold">Est. Total</span>
          <span className="text-xs font-black text-amber-900">
            ${costCalculation.totalCost.toFixed(5)}
          </span>
        </div>
      </div>
    </div>
  );
};
