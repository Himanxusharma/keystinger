import React from 'react';
import { KeyRound, ShieldCheck, Terminal, Send, PlusCircle, Wrench, Lock } from 'lucide-react';

export type ActiveTab = 'validate' | 'vault' | 'inspector' | 'sender' | 'tools';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  savedKeysCount: number;
  openCustomProviderModal: () => void;
  openSecurityModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedKeysCount,
  openCustomProviderModal,
  openSecurityModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 px-3.5 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
              KeyStinger
              <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                v1.0
              </span>
            </h1>
            <button
              onClick={openSecurityModal}
              className="text-[10px] text-emerald-700 font-semibold mt-0.5 hover:underline flex items-center gap-1"
              title="Click to view local security & AES-256 WebCrypto guarantee"
            >
              <Lock size={10} className="text-emerald-600" />
              <span>100% Local • AES-256 Encrypted</span>
            </button>
          </div>
        </div>

        <button
          onClick={openCustomProviderModal}
          className="flex items-center gap-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 shadow-xs"
          title="Paste a cURL command to add custom provider"
        >
          <PlusCircle size={13} className="text-slate-700" />
          <span>+ cURL</span>
        </button>
      </div>

      <nav className="grid grid-cols-5 gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-inner">
        <button
          onClick={() => setActiveTab('validate')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            activeTab === 'validate'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <KeyRound size={13} />
          <span>Keys</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-150 relative ${
            activeTab === 'vault'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ShieldCheck size={13} />
          <span>Vault</span>
          {savedKeysCount > 0 && (
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full font-bold leading-none ${
                activeTab === 'vault' ? 'bg-slate-950 text-amber-400' : 'bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              {savedKeysCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            activeTab === 'inspector'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Terminal size={13} />
          <span>Traffic</span>
        </button>

        <button
          onClick={() => setActiveTab('sender')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            activeTab === 'sender'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Send size={13} />
          <span>Request</span>
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            activeTab === 'tools'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Wrench size={13} />
          <span>Tools</span>
        </button>
      </nav>
    </header>
  );
};
