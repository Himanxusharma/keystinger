import React, { useState } from 'react';
import { Play, Loader2, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';
import { logExchange } from '../utils/storage';
import { CapturedExchange } from '../types';

interface TestPromptSandboxProps {
  providerId: string;
  modelId: string;
  apiKey: string;
}

export const TestPromptSandbox: React.FC<TestPromptSandboxProps> = ({ providerId, modelId, apiKey }) => {
  const [prompt, setPrompt] = useState<string>('Hello! Please confirm this key has active inference quota.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExecuteTest = async () => {
    if (!apiKey || !modelId) return;

    setIsLoading(true);
    setResponseOutput(null);
    setErrorMsg(null);
    setLatencyMs(null);

    const startTime = Date.now();
    const exchangeId = `ex_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let url = 'https://api.openai.com/v1/chat/completions';
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    };
    let bodyStr = JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60
    });

    if (providerId === 'anthropic') {
      url = 'https://api.anthropic.com/v1/messages';
      headers = {
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      };
      bodyStr = JSON.stringify({
        model: modelId,
        max_tokens: 60,
        messages: [{ role: 'user', content: prompt }]
      });
    } else if (providerId === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
      headers = {
        'x-goog-api-key': apiKey.trim(),
        'Content-Type': 'application/json'
      };
      bodyStr = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });
    } else if (providerId === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (providerId === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: bodyStr,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      setLatencyMs(durationMs);

      const text = await res.text();

      const exchange: CapturedExchange = {
        id: exchangeId,
        timestamp: startTime,
        providerId,
        request: {
          method: 'POST',
          url,
          headers,
          body: bodyStr
        },
        response: {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          body: text,
          durationMs
        }
      };

      await logExchange(exchange);

      if (res.ok) {
        let content = text;
        try {
          const parsed = JSON.parse(text);
          if (parsed.choices?.[0]?.message?.content) {
            content = parsed.choices[0].message.content;
          } else if (parsed.content?.[0]?.text) {
            content = parsed.content[0].text;
          } else if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
            content = parsed.candidates[0].content.parts[0].text;
          }
        } catch {
          // ignore
        }
        setResponseOutput(content);
      } else {
        let errMessage = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error?.message) errMessage = parsed.error.message;
        } catch {}
        setErrorMsg(errMessage);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Test execution failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
          <Terminal size={15} className="text-amber-600" />
          <span>Test Inference Sandbox</span>
        </div>
        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full font-mono border border-emerald-200">
          Inference Quota Test
        </span>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Test prompt string..."
          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-inner"
        />

        <button
          onClick={handleExecuteTest}
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 size={13} className="animate-spin text-amber-400" />
              <span>Executing Completion on {modelId}...</span>
            </>
          ) : (
            <>
              <Play size={13} className="text-amber-400 fill-amber-400" />
              <span>Run Test Inference ({modelId})</span>
            </>
          )}
        </button>
      </div>

      {responseOutput && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1 font-mono text-xs">
          <div className="flex items-center justify-between text-emerald-800 font-bold text-[10px]">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} /> Live Response Output
            </span>
            <span>{latencyMs}ms</span>
          </div>
          <p className="text-[11px] text-slate-800 bg-white p-2 rounded-md border border-slate-200 whitespace-pre-wrap shadow-inner">
            {responseOutput}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertTriangle size={14} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
