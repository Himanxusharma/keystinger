import React, { useState } from 'react';
import { Calculator, Columns, FileCode, RefreshCw, FileText } from 'lucide-react';
import { TokenCounter } from './TokenCounter';
import { ModelCompare } from './ModelCompare';
import { EnvExporter } from './EnvExporter';
import { LoadBalancerGenerator } from './LoadBalancerGenerator';
import { BatchEnvImporter } from './BatchEnvImporter';
import { CustomProvider } from '../types';

interface ToolsTabProps {
  customProviders: CustomProvider[];
  onKeysChanged?: () => void;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({ customProviders, onKeysChanged = () => {} }) => {
  const [activeSubTab, setActiveSubTab] = useState<'tokens' | 'compare' | 'env' | 'balancer' | 'batch'>('tokens');

  return (
    <div className="space-y-3.5">
      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveSubTab('tokens')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all ${
            activeSubTab === 'tokens'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator size={12} />
          <span>Tokens</span>
        </button>

        <button
          onClick={() => setActiveSubTab('compare')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all ${
            activeSubTab === 'compare'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Columns size={12} />
          <span>Compare</span>
        </button>

        <button
          onClick={() => setActiveSubTab('batch')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all ${
            activeSubTab === 'batch'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText size={12} />
          <span>Batch .env</span>
        </button>

        <button
          onClick={() => setActiveSubTab('env')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all ${
            activeSubTab === 'env'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCode size={12} />
          <span>.env</span>
        </button>

        <button
          onClick={() => setActiveSubTab('balancer')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all ${
            activeSubTab === 'balancer'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RefreshCw size={12} />
          <span>Balancer</span>
        </button>
      </div>

      {/* Active Tool View */}
      {activeSubTab === 'tokens' && <TokenCounter />}
      {activeSubTab === 'compare' && <ModelCompare />}
      {activeSubTab === 'batch' && (
        <BatchEnvImporter customProviders={customProviders} onImportComplete={onKeysChanged} />
      )}
      {activeSubTab === 'env' && <EnvExporter customProviders={customProviders} />}
      {activeSubTab === 'balancer' && <LoadBalancerGenerator />}
    </div>
  );
};
