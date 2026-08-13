import React, { useState } from 'react';
import { PlusCircle, Terminal, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { parseCurlCommand } from '../utils/curlParser';
import { saveCustomProvider } from '../utils/storage';

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
  const [curlText, setCurlText] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseAndSave = async () => {
    setError(null);
    setSuccessMsg(null);

    if (!curlText.trim()) {
      setError('Please paste a cURL command string.');
      return;
    }

    try {
      const parsed = parseCurlCommand(curlText.trim());

      const customProvider = {
        id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        label: label.trim() || parsed.url.split('/')[2] || 'Custom Gateway',
        baseUrl: parsed.url,
        validateMethod: (parsed.method === 'POST' ? 'POST' : 'GET') as 'GET' | 'POST',
        validatePath: '',
        authHeaderName: parsed.authHeaderName || 'Authorization',
        headers: parsed.headers,
        createdAt: Date.now()
      };

      await saveCustomProvider(customProvider);
      setSuccessMsg(`Successfully added custom provider: ${customProvider.label}`);
      setTimeout(() => {
        onProviderSaved();
        onClose();
        setCurlText('');
        setLabel('');
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to parse cURL command.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-4 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Add Custom Gateway via cURL
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Self-hosted or proxy endpoint parser</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-800 block mb-1">
              Gateway Provider Name / Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Internal vLLM Gateway"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-800">Paste cURL Command</label>
              <span className="text-[10px] text-slate-500 font-mono">curl https://...</span>
            </div>
            <textarea
              value={curlText}
              onChange={(e) => setCurlText(e.target.value)}
              placeholder={`curl https://my-local-gateway.com/v1/chat/completions \\\n  -H "Authorization: Bearer sk-1234" \\\n  -H "X-Custom-Header: value"`}
              rows={5}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 custom-scrollbar shadow-inner"
            />
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleParseAndSave}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
          >
            <Terminal size={13} />
            <span>Parse & Add Provider</span>
          </button>
        </div>
      </div>
    </div>
  );
};
