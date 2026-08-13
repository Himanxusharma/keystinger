import React, { useState } from 'react';
import { Gift, ExternalLink, Search, Sparkles, CheckCircle2, X } from 'lucide-react';
import { FREE_TIER_DATABASE } from '../utils/freeTiers';

interface FreeTierGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider?: (providerId: string) => void;
}

export const FreeTierGuideModal: React.FC<FreeTierGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectProvider
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const filteredProviders = FREE_TIER_DATABASE.filter(
    (p) =>
      p.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.freeLimitSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.badgeLabel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-4 space-y-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Gift size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                Free API Keys & Tier Directory
              </h3>
              <p className="text-[10px] text-slate-400">Official limits, allowances & claim links</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search free providers or limits..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Free Tier List */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredProviders.map((item) => (
            <div
              key={item.providerId}
              className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3 space-y-2 transition-all hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {item.providerName}
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        item.isCompletelyFree
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {item.badgeLabel}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {item.freeLimitSummary}
                  </p>
                </div>
              </div>

              {/* Rate Limits & Action */}
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 font-mono text-slate-400">
                  {item.rpmLimit && <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{item.rpmLimit}</span>}
                  {item.rpdLimit && <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{item.rpdLimit}</span>}
                  {item.creditGrant && <span className="text-emerald-400 font-sans font-bold">{item.creditGrant}</span>}
                </div>

                <a
                  href={item.getKeyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-md text-[10px] transition-all flex items-center gap-1 shrink-0"
                >
                  <span>Claim Free Key</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
