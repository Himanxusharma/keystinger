import React, { useState } from 'react';
import { Calculator, Columns, FileCode } from 'lucide-react';
import { TokenCounter } from './TokenCounter';
import { ModelCompare } from './ModelCompare';
import { EnvExporter } from './EnvExporter';
import { CustomProvider } from '../types';

interface ToolsTabProps {
  customProviders: CustomProvider[];
}

export const ToolsTab: React.FC<ToolsTabProps> = ({ customProviders }) => {
  const [activeSubTab, setActiveSubTab] = useState<'tokens' | 'compare' | 'env'>('tokens');

  return (
    <div className="space-y-3.5">
      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveSubTab('tokens')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'tokens'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator size={13} />
          <span>Tokens</span>
        </button>

        <button
          onClick={() => setActiveSubTab('compare')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'compare'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Columns size={13} />
          <span>Compare</span>
        </button>

        <button
          onClick={() => setActiveSubTab('env')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'env'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode size={13} />
          <span>.env</span>
        </button>
      </div>

      {/* Active Tool View */}
      {activeSubTab === 'tokens' && <TokenCounter />}
      {activeSubTab === 'compare' && <ModelCompare />}
      {activeSubTab === 'env' && <EnvExporter customProviders={customProviders} />}
    </div>
  );
};
