import React, { useState } from 'react';
import { X, PlusCircle, AlertTriangle, CheckCircle2, Code2, ShieldAlert } from 'lucide-react';
import { CustomProvider } from '../types';
import { parseCurlCommand, ParsedCurl } from '../utils/curlParser';
import { saveCustomProvider } from '../utils/storage';
import { ensureHostPermission } from '../adapters/registry';

interface CustomProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderSaved: () => void;
}

export const CustomProviderModal: React.FC<CustomProviderModalProps> = ({
  isOpen,
  onClose,
  onProviderSaved
}) => {
  const [rawCurl, setRawCurl] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedCurl | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [label, setLabel] = useState<string>('');

  if (!isOpen) return null;

  const handleParse = () => {
    setErrorMsg(null);
    try {
      const result = parseCurlCommand(rawCurl);
      setParsed(result);

      // Auto generate label from URL
      try {
        const u = new URL(result.url);
        setLabel(u.hostname);
      } catch {
        setLabel('Custom Gateway');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse cURL command.');
      setParsed(null);
    }
  };

  const handleSave = async () => {
    if (!parsed || !label.trim()) return;

    try {
      const u = new URL(parsed.url);
      const origin = u.origin;
      await ensureHostPermission(origin);

      const customProv: CustomProvider = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        label: label.trim(),
        baseUrl: origin,
        validateMethod: parsed.method as any,
        validatePath: u.pathname || '/v1/models',
        headers: parsed.headers,
        authHeaderName: parsed.authHeaderName
      };

      await saveCustomProvider(customProv);
      onProviderSaved();
      onClose();

      // Reset state
      setRawCurl('');
      setParsed(null);
      setLabel('');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save custom provider.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-4 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="text-amber-400" size={18} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Add Custom Provider via cURL
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* cURL Input */}
        {!parsed ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Paste a <code className="text-amber-300 font-mono">curl</code> command copied from provider docs or browser DevTools. It will be parsed safely on client-side.
            </p>

            <textarea
              value={rawCurl}
              onChange={(e) => setRawCurl(e.target.value)}
              placeholder={`curl https://my-llm.example.com/v1/models \\\n  -H "Authorization: Bearer sk-1234"`}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 custom-scrollbar"
            />

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={!rawCurl.trim()}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Code2 size={14} />
              <span>Parse cURL Command</span>
            </button>
          </div>
        ) : (
          /* Structured Preview Table */
          <div className="space-y-3">
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <span>cURL parsed successfully. Review configuration below:</span>
            </div>

            {parsed.warnings.length > 0 && (
              <div className="p-2 bg-amber-950/30 border border-amber-500/30 rounded-lg text-[11px] text-amber-300 flex items-center gap-2">
                <ShieldAlert size={13} className="shrink-0 text-amber-400" />
                <span>{parsed.warnings[0]}</span>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Provider Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. My Internal Ollama Gateway"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Endpoint URL</label>
                <div className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs font-mono text-amber-300 truncate">
                  {parsed.method} {parsed.url}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Parsed Headers</label>
                <pre className="bg-slate-950 border border-slate-800 rounded-md p-2 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-24">
                  <code>{JSON.stringify(parsed.headers, null, 2)}</code>
                </pre>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setParsed(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-1.5 rounded-lg text-xs"
              >
                Re-edit cURL
              </button>
              <button
                onClick={handleSave}
                disabled={!label.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-lg text-xs transition-all disabled:opacity-50"
              >
                Confirm & Save Provider
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
