import React, { useState, useEffect } from 'react';
import { Send, Loader2, Plus, Trash2, BookmarkPlus, Check, Copy, AlertTriangle } from 'lucide-react';
import { BUILTIN_PROVIDERS } from '../adapters/registry';
import { getSavedKeys, getRequestTemplates, saveRequestTemplate, deleteRequestTemplate, logExchange } from '../utils/storage';
import { decryptKey } from '../utils/crypto';
import { SavedKey, CapturedExchange, RequestTemplate } from '../types';

export const CustomRequestSender: React.FC = () => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('POST');
  const [url, setUrl] = useState<string>('https://api.openai.com/v1/chat/completions');
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: 'Content-Type', value: 'application/json' }
  ]);
  const [body, setBody] = useState<string>(
    JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: 'Hello' }] }, null, 2)
  );

  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');

  const [templates, setTemplates] = useState<RequestTemplate[]>([]);
  const [templateName, setTemplateName] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseDuration, setResponseDuration] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const loadData = async () => {
    const keys = await getSavedKeys();
    setSavedKeys(keys);
    const tmpls = await getRequestTemplates();
    setTemplates(tmpls);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...headers];
    updated[index][field] = val;
    setHeaders(updated);
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleApplySavedKey = async (keyId: string) => {
    setSelectedKeyId(keyId);
    if (!keyId) return;

    const keyRecord = savedKeys.find((k) => k.id === keyId);
    if (!keyRecord) return;

    try {
      const decrypted = await decryptKey(keyRecord.encryptedKey, keyRecord.iv);
      const provider = BUILTIN_PROVIDERS.find((p) => p.id === keyRecord.providerId);

      let headerName = 'Authorization';
      let headerVal = `Bearer ${decrypted}`;

      if (keyRecord.providerId === 'anthropic') {
        headerName = 'x-api-key';
        headerVal = decrypted;
      } else if (keyRecord.providerId === 'gemini') {
        headerName = 'x-goog-api-key';
        headerVal = decrypted;
      }

      const filtered = headers.filter((h) => h.key.toLowerCase() !== headerName.toLowerCase());
      setHeaders([{ key: headerName, value: headerVal }, ...filtered]);

      if (provider) {
        if (keyRecord.providerId === 'openai') setUrl('https://api.openai.com/v1/chat/completions');
        else if (keyRecord.providerId === 'anthropic') setUrl('https://api.anthropic.com/v1/messages');
        else if (keyRecord.providerId === 'gemini') setUrl('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadPresetTemplate = (preset: 'openai' | 'claude' | 'gemini') => {
    if (preset === 'openai') {
      setMethod('POST');
      setUrl('https://api.openai.com/v1/chat/completions');
      setBody(JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Hello' }] }, null, 2));
    } else if (preset === 'claude') {
      setMethod('POST');
      setUrl('https://api.anthropic.com/v1/messages');
      setBody(JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1024, messages: [{ role: 'user', content: 'Hello Claude' }] }, null, 2));
    } else if (preset === 'gemini') {
      setMethod('POST');
      setUrl('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent');
      setBody(JSON.stringify({ contents: [{ parts: [{ text: 'Hello Gemini' }] }] }, null, 2));
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    const newTmpl: RequestTemplate = {
      id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: templateName.trim(),
      method,
      url,
      headers,
      body,
      createdAt: Date.now()
    };
    await saveRequestTemplate(newTmpl);
    setTemplateName('');
    await loadData();
  };

  const handleApplyTemplate = (tmpl: RequestTemplate) => {
    setMethod(tmpl.method);
    setUrl(tmpl.url);
    setHeaders(tmpl.headers);
    setBody(tmpl.body);
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteRequestTemplate(id);
    await loadData();
  };

  const handleSendRequest = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setResponseOutput(null);
    setResponseStatus(null);
    setResponseDuration(null);

    const startTime = Date.now();
    const exchangeId = `ex_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const reqHeaders: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.key.trim()) reqHeaders[h.key.trim()] = h.value;
    });

    try {
      const options: RequestInit = {
        method,
        headers: reqHeaders
      };
      if (method !== 'GET' && body) {
        options.body = body;
      }

      const res = await fetch(url.trim(), options);
      const durationMs = Date.now() - startTime;
      const responseText = await res.text();

      setResponseStatus(res.status);
      setResponseDuration(durationMs);
      setResponseOutput(responseText);

      const exchange: CapturedExchange = {
        id: exchangeId,
        timestamp: startTime,
        providerId: 'custom_sender',
        request: {
          method,
          url: url.trim(),
          headers: reqHeaders,
          body
        },
        response: {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          body: responseText,
          durationMs
        }
      };

      await logExchange(exchange);
    } catch (err: any) {
      setResponseStatus(0);
      setResponseOutput(`Network Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatOutput = (text: string) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  const handleCopyOutput = () => {
    if (!responseOutput) return;
    navigator.clipboard.writeText(responseOutput);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Presets Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="text-amber-600" size={18} />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Custom Request Sender
            </h3>
          </div>

          <div className="flex items-center gap-1">
            {(['openai', 'claude', 'gemini'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handleLoadPresetTemplate(p)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all uppercase"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Inject Saved Key */}
        {savedKeys.length > 0 && (
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">
              Inject Credentials from Vault Key
            </label>
            <select
              value={selectedKeyId}
              onChange={(e) => handleApplySavedKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
            >
              <option value="">-- Select Saved Vault Key --</option>
              {savedKeys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nickname} ({k.providerId})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Request Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-sm">
        {/* Method & URL */}
        <div className="flex items-center gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-extrabold text-slate-900"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.openai.com/v1/..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-inner"
          />
        </div>

        {/* Header Key-Value Rows */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700">HTTP Headers</label>
            <button
              onClick={handleAddHeader}
              className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
            >
              <Plus size={11} /> Add Header
            </button>
          </div>

          {headers.map((h, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="text"
                value={h.key}
                onChange={(e) => handleHeaderChange(i, 'key', e.target.value)}
                placeholder="Header Key"
                className="w-1/3 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-900"
              />
              <input
                type="text"
                value={h.value}
                onChange={(e) => handleHeaderChange(i, 'value', e.target.value)}
                placeholder="Header Value"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-900"
              />
              <button
                onClick={() => handleRemoveHeader(i)}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Body Text */}
        {method !== 'GET' && (
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Request Body (JSON)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="{}"
              rows={4}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 custom-scrollbar shadow-inner"
            />
          </div>
        )}

        {/* Send Action */}
        <button
          onClick={handleSendRequest}
          disabled={isLoading || !url.trim()}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin text-slate-950" />
              <span>Sending HTTP Request...</span>
            </>
          ) : (
            <>
              <Send size={15} />
              <span>Send Request</span>
            </>
          )}
        </button>
      </div>

      {/* Response Box */}
      {responseOutput !== null && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between font-mono text-xs border-b border-slate-100 pb-2">
            <span className={`font-bold px-2 py-0.5 rounded border ${
              responseStatus && responseStatus < 300
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              Status: {responseStatus}
            </span>
            <span className="text-[10px] text-slate-500 font-sans font-bold">{responseDuration}ms</span>
          </div>

          <div className="relative">
            <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-56 custom-scrollbar shadow-inner">
              <code>{formatOutput(responseOutput)}</code>
            </pre>
            <button
              onClick={handleCopyOutput}
              className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 p-1.5 rounded-md text-xs transition-all active:scale-95 flex items-center gap-1"
            >
              {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
