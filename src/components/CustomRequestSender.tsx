import React, { useState } from 'react';
import { Send, Plus, Trash2, ShieldAlert, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CustomRequestState, HeaderRow, CapturedExchange } from '../types';
import { ensureHostPermission } from '../adapters/registry';
import { logExchange } from '../utils/storage';

export const CustomRequestSender: React.FC = () => {
  const [reqState, setReqState] = useState<CustomRequestState>({
    method: 'GET',
    url: 'https://api.openai.com/v1/models',
    headers: [
      { key: 'Authorization', value: 'Bearer sk-...' },
      { key: 'Accept', value: 'application/json' }
    ],
    body: ''
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastExchange, setLastExchange] = useState<CapturedExchange | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addHeaderRow = () => {
    setReqState((prev) => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }]
    }));
  };

  const updateHeaderRow = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...reqState.headers];
    next[index][field] = val;
    setReqState((prev) => ({ ...prev, headers: next }));
  };

  const removeHeaderRow = (index: number) => {
    setReqState((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  const handleSend = async () => {
    if (!reqState.url.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setLastExchange(null);

    const startTime = Date.now();
    const exchangeId = `ex_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      const u = new URL(reqState.url);
      await ensureHostPermission(u.origin);

      const headerObj: Record<string, string> = {};
      reqState.headers.forEach((h) => {
        if (h.key.trim()) {
          headerObj[h.key.trim()] = h.value.trim();
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const options: RequestInit = {
        method: reqState.method,
        headers: headerObj,
        signal: controller.signal
      };

      if (['POST', 'PUT', 'PATCH'].includes(reqState.method) && reqState.body) {
        options.body = reqState.body;
      }

      const res = await fetch(reqState.url, options);
      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;
      const resText = await res.text();

      const exchange: CapturedExchange = {
        id: exchangeId,
        timestamp: startTime,
        request: {
          method: reqState.method,
          url: reqState.url,
          headers: headerObj,
          body: reqState.body || undefined
        },
        response: {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          body: resText.slice(0, 2 * 1024 * 1024), // 2MB cap
          durationMs
        }
      };

      await logExchange(exchange);
      setLastExchange(exchange);
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const isTimeout = err.name === 'AbortError';
      const msg = isTimeout ? 'Request timed out (8s limit).' : err.message || 'Failed to execute custom request.';

      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="text-amber-400" size={18} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Custom Request Sender
          </h2>
        </div>
        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
          Ad-hoc Sandbox
        </span>
      </div>

      {/* URL & Method Row */}
      <div className="flex items-center gap-2">
        <select
          value={reqState.method}
          onChange={(e) => setReqState((prev) => ({ ...prev, method: e.target.value as any }))}
          className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none"
        >
          {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={reqState.url}
          onChange={(e) => setReqState((prev) => ({ ...prev, url: e.target.value }))}
          placeholder="https://api.provider.com/v1/..."
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Header Rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-300">Request Headers</label>
          <button
            onClick={addHeaderRow}
            className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Plus size={12} /> Add Header
          </button>
        </div>

        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
          {reqState.headers.map((h, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="text"
                value={h.key}
                onChange={(e) => updateHeaderRow(i, 'key', e.target.value)}
                placeholder="Header (e.g. Authorization)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-white"
              />
              <input
                type="text"
                value={h.value}
                onChange={(e) => updateHeaderRow(i, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-white"
              />
              <button
                onClick={() => removeHeaderRow(i)}
                className="text-slate-500 hover:text-rose-400 p-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Request Body (for POST/PUT/PATCH) */}
      {['POST', 'PUT', 'PATCH'].includes(reqState.method) && (
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Payload Body (JSON / Raw)</label>
          <textarea
            value={reqState.body}
            onChange={(e) => setReqState((prev) => ({ ...prev, body: e.target.value }))}
            placeholder='{ "model": "gpt-4o", "messages": [...] }'
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 custom-scrollbar"
          />
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={isLoading || !reqState.url.trim()}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={15} className="animate-spin text-slate-950" />
            <span>Sending Direct Request...</span>
          </>
        ) : (
          <>
            <Send size={15} />
            <span>Execute Request & Inspect Traffic</span>
          </>
        )}
      </button>

      {/* Result Status */}
      {lastExchange && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-300 font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-400" /> Response: {lastExchange.response.status} {lastExchange.response.statusText}
            </span>
            <span className="font-mono text-[10px] text-slate-400">{lastExchange.response.durationMs}ms</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Request exchange logged to Traffic Inspector. Switch tabs to view full unmasked headers & response JSON.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
