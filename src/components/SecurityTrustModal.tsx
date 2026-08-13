import React from 'react';
import { ShieldCheck, Lock, Cpu, HardDrive, CheckCircle2, X } from 'lucide-react';

interface SecurityTrustModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityTrustModal: React.FC<SecurityTrustModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-4 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Local Security & Privacy Guarantee
              </h3>
              <p className="text-[10px] text-emerald-700 font-bold">100% On-Device • Zero Cloud Proxy</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5 text-xs text-slate-700">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <Cpu size={14} className="text-amber-600" />
              <span>Direct Browser Fetch (Zero Proxy)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              All validation calls originate directly from your Chrome browser to provider endpoints (e.g. <code className="text-slate-900 font-bold">api.openai.com</code>). KeyStinger has zero middleman servers.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <Lock size={14} className="text-emerald-600" />
              <span>AES-256 WebCrypto Encryption at Rest</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              API keys are encrypted using WebCrypto AES-GCM 256-bit algorithm before being written to <code className="text-slate-900 font-bold">chrome.storage.local</code>. Raw plaintext keys never exist on disk.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-800">
              <HardDrive size={14} className="text-blue-600" />
              <span>100% On-Device Local Persistence</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              Your credentials remain strictly on your machine. No telemetry, no analytics, no external tracking scripts.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
            <CheckCircle2 size={11} /> Verified MV3 Architecture
          </span>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs transition-all shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
