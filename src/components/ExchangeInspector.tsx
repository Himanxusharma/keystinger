import React, { useState, useEffect } from 'react';
import { Terminal, Trash2, Copy, Check, Lock, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react';
import { CapturedExchange } from '../types';
import { getCapturedExchanges, clearExchanges } from '../utils/storage';

export const ExchangeInspector: React.FC = () => {
  const [exchanges, setExchanges] = useState<CapturedExchange[]>([]);
  const [selectedExchangeId, setSelectedExchangeId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'request' | 'response' | 'curl'>('response');

  const loadExchanges = async () => {
    const data = await getCapturedExchanges();
    setExchanges(data);
    if (data.length > 0 && !selectedExchangeId) {
      setSelectedExchangeId(data[0].id);
    }
  };

  useEffect(() => {
    loadExchanges();
  }, []);

  const handleClear = async () => {
    await clearExchanges();
    setExchanges([]);
    setSelectedExchangeId(null);
  };

  const activeExchange = exchanges.find((e) => e.id === selectedExchangeId) || exchanges[0];

  const formatJson = (str: string): string => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  const generateCurlFromExchange = (ex: CapturedExchange): string => {
    const headersList = Object.entries(ex.request.headers)
      .map(([k, v]) => `-H "${k}: ${v}"`)
      .join(' \\\n  ');
    const bodyArg = ex.request.body ? ` \\\n  -d '${ex.request.body}'` : '';
    return `curl -X ${ex.request.method} "${ex.request.url}" \\\n  ${headersList}${bodyArg}`;
  };

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-amber-600" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 leading-none">
              Traffic Exchange Log ({exchanges.length})
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              <Lock size={9} className="text-emerald-600" /> Credential Headers Masked in Memory
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          disabled={exchanges.length === 0}
          className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 shadow-xs"
        >
          <Trash2 size={12} />
          <span>Clear Log</span>
        </button>
      </div>

      {exchanges.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2 shadow-xs">
          <Terminal size={28} className="mx-auto text-slate-300" />
          <p className="text-xs text-slate-500 font-medium">
            No HTTP traffic captured yet. Perform a validation call to inspect raw exchanges.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {/* Exchange Selector Dropdown */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Exchange Request</label>
            <select
              value={selectedExchangeId || ''}
              onChange={(e) => setSelectedExchangeId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 shadow-xs focus:outline-none focus:border-amber-500"
            >
              {exchanges.map((e) => (
                <option key={e.id} value={e.id}>
                  [{new Date(e.timestamp).toLocaleTimeString()}] {e.request.method} {e.providerId} ({e.response.status})
                </option>
              ))}
            </select>
          </div>

          {activeExchange && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-sm">
              {/* Status Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                    {activeExchange.request.method}
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded border ${
                    activeExchange.response.status < 300
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {activeExchange.response.status} {activeExchange.response.statusText}
                  </span>
                </div>

                <span className="text-[10px] text-slate-500 font-sans font-bold">
                  {activeExchange.response.durationMs}ms
                </span>
              </div>

              {/* Sub tab navigation */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setActiveSubTab('response')}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                    activeSubTab === 'response' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Response Body
                </button>
                <button
                  onClick={() => setActiveSubTab('request')}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                    activeSubTab === 'request' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Request Headers
                </button>
                <button
                  onClick={() => setActiveSubTab('curl')}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                    activeSubTab === 'curl' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Export cURL
                </button>
              </div>

              {/* Sub tab content */}
              <div className="relative">
                {activeSubTab === 'response' && (
                  <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-56 custom-scrollbar shadow-inner">
                    <code>{formatJson(activeExchange.response.body)}</code>
                  </pre>
                )}

                {activeSubTab === 'request' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-56 custom-scrollbar space-y-1 shadow-inner">
                    <p className="text-amber-400 font-bold mb-1">// Target URL</p>
                    <p className="text-slate-300">{activeExchange.request.url}</p>
                    <p className="text-amber-400 font-bold mt-2 mb-1">// Headers (Credentials Masked)</p>
                    {Object.entries(activeExchange.request.headers).map(([k, v]) => (
                      <div key={k} className="text-slate-300">
                        <span className="text-emerald-400">{k}:</span> {v}
                      </div>
                    ))}
                  </div>
                )}

                {activeSubTab === 'curl' && (
                  <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-56 custom-scrollbar shadow-inner">
                    <code>{generateCurlFromExchange(activeExchange)}</code>
                  </pre>
                )}

                <button
                  onClick={() =>
                    handleCopySnippet(
                      activeSubTab === 'response'
                        ? activeExchange.response.body
                        : activeSubTab === 'request'
                        ? JSON.stringify(activeExchange.request.headers, null, 2)
                        : generateCurlFromExchange(activeExchange)
                    )
                  }
                  className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 p-1.5 rounded-md text-xs transition-all active:scale-95 flex items-center gap-1"
                  title="Copy snippet"
                >
                  {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
