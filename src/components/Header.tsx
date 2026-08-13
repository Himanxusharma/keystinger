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
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-3.5 py-3 shadow-xl">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-[1.5px] shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-amber-400 font-black text-xs tracking-tighter">KS</span>
            </div>
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-none">
              KeyStinger
              <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                v1.0
              </span>
            </h1>
            <button
              onClick={openSecurityModal}
              className="text-[10px] text-emerald-400 font-semibold mt-0.5 hover:underline flex items-center gap-1"
              title="Click to view local security & AES-256 WebCrypto guarantee"
            >
              <Lock size={10} className="text-emerald-400" />
              <span>100% Local • AES-256 Encrypted</span>
            </button>
          </div>
        </div>

        <button
          onClick={openCustomProviderModal}
          className="flex items-center gap-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm"
          title="Paste a cURL command to add custom provider"
        >
          <PlusCircle size={13} className="text-amber-400" />
          <span>+ cURL</span>
        </button>
      </div>

      <nav className="grid grid-cols-5 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 shadow-inner">
        <button
          onClick={() => setActiveTab('validate')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            activeTab === 'validate'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <KeyRound size={13} />
          <span>Keys</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-150 relative ${
            activeTab === 'vault'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck size={13} />
          <span>Vault</span>
          {savedKeysCount > 0 && (
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full font-bold leading-none ${
                activeTab === 'vault' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-300 border border-slate-700'
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
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Terminal size={13} />
          <span>Traffic</span>
        </button>

        <button
          onClick={() => setActiveTab('sender')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            activeTab === 'sender'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Send size={13} />
          <span>Request</span>
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            activeTab === 'tools'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Wrench size={13} />
          <span>Tools</span>
        </button>
      </nav>
    </header>
  );
};
