import React, { useState, useEffect } from 'react';
import { Send, Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, BookmarkPlus, FolderOpen } from 'lucide-react';
import { CustomRequestState, HeaderRow, CapturedExchange, RequestTemplate } from '../types';
import { ensureHostPermission } from '../adapters/registry';
import { logExchange, getRequestTemplates, saveRequestTemplate, deleteRequestTemplate } from '../utils/storage';

const BUILTIN_TEMPLATES: RequestTemplate[] = [
  {
    id: 'tmpl_openai_chat',
    name: 'OpenAI — Chat Completion',
    method: 'POST',
    url: 'https://api.openai.com/v1/chat/completions',
    headers: [
      { key: 'Authorization', value: 'Bearer sk-...' },
      { key: 'Content-Type', value: 'application/json' }
    ],
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello OpenAI' }]
    }, null, 2),
    createdAt: Date.now()
  },
  {
    id: 'tmpl_claude_msg',
    name: 'Anthropic — Messages API',
    method: 'POST',
    url: 'https://api.anthropic.com/v1/messages',
    headers: [
      { key: 'x-api-key', value: 'sk-ant-...' },
      { key: 'anthropic-version', value: '2023-06-01' },
      { key: 'Content-Type', value: 'application/json' }
    ],
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Hello Claude' }]
    }, null, 2),
    createdAt: Date.now()
  },
  {
    id: 'tmpl_gemini_content',
    name: 'Gemini — Generate Content',
    method: 'POST',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    headers: [
      { key: 'x-goog-api-key', value: 'AIza...' },
      { key: 'Content-Type', value: 'application/json' }
    ],
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Hello Gemini' }] }]
    }, null, 2),
    createdAt: Date.now()
  }
];

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

  const [savedTemplates, setSavedTemplates] = useState<RequestTemplate[]>([]);
  const [templateName, setTemplateName] = useState<string>('');
  const [showSaveTemplate, setShowSaveTemplate] = useState<boolean>(false);

  const loadTemplates = async () => {
    const customTmpls = await getRequestTemplates();
    setSavedTemplates(customTmpls);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const allTemplates = [...BUILTIN_TEMPLATES, ...savedTemplates];

  const handleSelectTemplate = (templateId: string) => {
    if (!templateId) return;
    const found = allTemplates.find((t) => t.id === templateId);
    if (found) {
      setReqState({
        method: found.method,
        url: found.url,
        headers: [...found.headers],
        body: found.body || ''
      });
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !reqState.url.trim()) return;

    const newTmpl: RequestTemplate = {
      id: `tmpl_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: templateName.trim(),
      method: reqState.method,
      url: reqState.url,
      headers: reqState.headers,
      body: reqState.body,
      createdAt: Date.now()
    };

    await saveRequestTemplate(newTmpl);
    await loadTemplates();
    setTemplateName('');
    setShowSaveTemplate(false);
  };

  const handleDeleteCustomTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteRequestTemplate(id);
    await loadTemplates();
  };

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
            Custom Request Sandbox
          </h2>
        </div>
        <button
          onClick={() => setShowSaveTemplate(!showSaveTemplate)}
          className="text-[10px] font-semibold text-amber-300 hover:text-amber-200 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1"
        >
          <BookmarkPlus size={11} className="text-amber-400" /> Save Template
        </button>
      </div>

      {/* Template Preset Loader */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
          <FolderOpen size={14} className="text-amber-400" />
          <span>Load Request Template</span>
        </div>
        <select
          onChange={(e) => handleSelectTemplate(e.target.value)}
          defaultValue=""
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
        >
          <option value="" disabled>
            Select a template to auto-fill...
          </option>
          <optgroup label="Built-in Presets">
            {BUILTIN_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </optgroup>
          {savedTemplates.length > 0 && (
            <optgroup label="My Saved Templates">
              {savedTemplates.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Save Template Inline Form */}
      {showSaveTemplate && (
        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
          <label className="text-[11px] font-semibold text-amber-300 block">Save Current Request as Template</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name (e.g. Ollama Local Endpoint)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}

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
