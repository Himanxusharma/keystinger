import React from 'react';
import { KeyRound, ShieldCheck, Terminal, Send, PlusCircle, Wrench } from 'lucide-react';

export type ActiveTab = 'validate' | 'vault' | 'inspector' | 'sender' | 'tools';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  savedKeysCount: number;
  openCustomProviderModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedKeysCount,
  openCustomProviderModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <span className="text-amber-400 font-black text-sm tracking-tighter">KS</span>
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
              KeyStinger
              <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                MV3
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Multi-Provider Credential Vault</p>
          </div>
        </div>

        <button
          onClick={openCustomProviderModal}
          className="flex items-center gap-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/40 px-2.5 py-1.5 rounded-md transition-all active:scale-95 shadow-sm"
          title="Paste a cURL command to add custom provider"
        >
          <PlusCircle size={13} className="text-amber-400" />
          <span>+ cURL</span>
        </button>
      </div>

      <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800/80">
        <button
          onClick={() => setActiveTab('validate')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition-all ${
            activeTab === 'validate'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <KeyRound size={13} />
          <span>Validate</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition-all relative ${
            activeTab === 'vault'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
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
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition-all ${
            activeTab === 'inspector'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Terminal size={13} />
          <span>Traffic</span>
        </button>

        <button
          onClick={() => setActiveTab('sender')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition-all ${
            activeTab === 'sender'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Send size={13} />
          <span>Request</span>
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition-all ${
            activeTab === 'tools'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
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
