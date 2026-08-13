import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Eye, EyeOff, Trash2, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react';
import { CapturedExchange } from '../types';
import { getCapturedExchanges, clearExchanges } from '../utils/storage';
import { exportToCurl } from '../utils/curlParser';
import { maskApiKey } from '../utils/crypto';

export const ExchangeInspector: React.FC = () => {
  const [exchanges, setExchanges] = useState<CapturedExchange[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMaskedKeys, setShowMaskedKeys] = useState<Record<string, boolean>>({});
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const loadLogs = async () => {
    const logs = await getCapturedExchanges();
    setExchanges(logs);
    if (logs.length > 0 && !expandedId) {
      setExpandedId(logs[0].id);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClear = async () => {
    await clearExchanges();
    setExchanges([]);
    setExpandedId(null);
  };

  const toggleMask = (id: string) => {
    setShowMaskedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCurl = (ex: CapturedExchange) => {
    const curl = exportToCurl(ex.request.method, ex.request.url, ex.request.headers, ex.request.body);
    navigator.clipboard.writeText(curl);
    setCopiedType(`curl_${ex.id}`);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const formatHeaders = (headers: Record<string, string>, shouldUnmask: boolean): Record<string, string> => {
    const formatted: Record<string, string> = {};
    Object.entries(headers).forEach(([k, v]) => {
      if (/authorization/i.test(k) || /x-api-key/i.test(k) || /x-goog-api-key/i.test(k)) {
        if (shouldUnmask) {
          formatted[k] = v;
        } else {
          if (v.startsWith('Bearer ')) {
            formatted[k] = `Bearer ${maskApiKey(v.replace('Bearer ', ''))}`;
          } else {
            formatted[k] = maskApiKey(v);
          }
        }
      } else {
        formatted[k] = v;
      }
    });
    return formatted;
  };

  const prettyJson = (str: string): string => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="text-amber-400" size={18} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Traffic Inspector ({exchanges.length})
          </h2>
        </div>
        {exchanges.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded transition-colors"
          >
            <Trash2 size={11} /> Clear Logs
          </button>
        )}
      </div>

      {exchanges.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center space-y-2">
          <Terminal size={24} className="mx-auto text-slate-600" />
          <p className="text-xs font-medium text-slate-400">No captured network exchanges yet.</p>
          <p className="text-[11px] text-slate-500">
            Make a validation or custom request to inspect the exact raw headers & payloads sent from your browser.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {exchanges.map((ex) => {
            const isExpanded = expandedId === ex.id;
            const isUnmasked = Boolean(showMaskedKeys[ex.id]);

            return (
              <div
                key={ex.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all"
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                  className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-mono text-xs truncate">
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-amber-400 shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    )}
                    <span className="font-bold text-amber-400 uppercase">{ex.request.method}</span>
                    <span className="truncate text-slate-300 max-w-[180px]">{ex.request.url}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        ex.response.status >= 200 && ex.response.status < 300
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {ex.response.status || 'ERR'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{ex.response.durationMs}ms</span>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-slate-800/80 space-y-3 bg-slate-950/60">
                    {/* Security Mask Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <ShieldAlert size={11} className="text-amber-400" /> Header credentials masked by default
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleMask(ex.id)}
                          className="text-[10px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                        >
                          {isUnmasked ? <EyeOff size={11} /> : <Eye size={11} />}
                          <span>{isUnmasked ? 'Mask Key' : 'Reveal Key'}</span>
                        </button>
                        <button
                          onClick={() => handleCopyCurl(ex)}
                          className="text-[10px] font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                        >
                          {copiedType === `curl_${ex.id}` ? (
                            <Check size={11} className="text-emerald-400" />
                          ) : (
                            <Copy size={11} />
                          )}
                          <span>Copy cURL</span>
                        </button>
                      </div>
                    </div>

                    {/* Request Headers & Body */}
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-300 uppercase mb-1">Request Headers</h5>
                      <pre className="bg-slate-900 border border-slate-800 rounded-md p-2 text-[10px] font-mono text-slate-300 overflow-x-auto">
                        <code>{JSON.stringify(formatHeaders(ex.request.headers, isUnmasked), null, 2)}</code>
                      </pre>
                    </div>

                    {ex.request.body && (
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-300 uppercase mb-1">Request Payload</h5>
                        <pre className="bg-slate-900 border border-slate-800 rounded-md p-2 text-[10px] font-mono text-amber-300 overflow-x-auto max-h-24">
                          <code>{prettyJson(ex.request.body)}</code>
                        </pre>
                      </div>
                    )}

                    {/* Response Status & Body */}
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-300 uppercase mb-1">
                        Response ({ex.response.status} {ex.response.statusText})
                      </h5>
                      <pre className="bg-slate-900 border border-slate-800 rounded-md p-2 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-40 custom-scrollbar">
                        <code>{prettyJson(ex.response.body)}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
