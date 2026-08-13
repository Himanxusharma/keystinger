import React, { useState } from 'react';
import { FileCode, Copy, Check, Lock, ShieldAlert } from 'lucide-react';
import { SavedKey, CustomProvider } from '../types';
import { decryptKey } from '../utils/crypto';
import { getSavedKeys } from '../utils/storage';

interface EnvExporterProps {
  customProviders: CustomProvider[];
}

type ExportFormat = 'env' | 'vercel' | 'github';

export const EnvExporter: React.FC<EnvExporterProps> = ({ customProviders }) => {
  const [format, setFormat] = useState<ExportFormat>('env');
  const [exportedText, setExportedText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const mapProviderToEnvVar = (providerId: string, nickname: string): string => {
    const cleanNick = nickname.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    switch (providerId) {
      case 'openai':
        return 'OPENAI_API_KEY';
      case 'anthropic':
        return 'ANTHROPIC_API_KEY';
      case 'gemini':
        return 'GEMINI_API_KEY';
      case 'nvidia':
        return 'NVIDIA_API_KEY';
      case 'mistral':
        return 'MISTRAL_API_KEY';
      case 'groq':
        return 'GROQ_API_KEY';
      case 'xai':
        return 'XAI_API_KEY';
      case 'cohere':
        return 'COHERE_API_KEY';
      case 'perplexity':
        return 'PERPLEXITY_API_KEY';
      case 'deepseek':
        return 'DEEPSEEK_API_KEY';
      case 'openrouter':
        return 'OPENROUTER_API_KEY';
      default:
        return `${cleanNick}_API_KEY`;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const keys = await getSavedKeys();
      if (keys.length === 0) {
        setExportedText('# No saved keys found in vault to export.');
        return;
      }

      const pairs: Array<{ keyName: string; value: string }> = [];
      for (const k of keys) {
        const decrypted = await decryptKey(k.encryptedKey, k.iv);
        const envName = mapProviderToEnvVar(k.providerId, k.nickname);
        pairs.push({ keyName: envName, value: decrypted });
      }

      if (format === 'env') {
        const lines = pairs.map((p) => `${p.keyName}=${p.value}`);
        setExportedText(lines.join('\n'));
      } else if (format === 'vercel') {
        const obj: Record<string, string> = {};
        pairs.forEach((p) => (obj[p.keyName] = p.value));
        setExportedText(JSON.stringify({ env: obj }, null, 2));
      } else {
        const lines = [
          'env:',
          ...pairs.map((p) => `  ${p.keyName}: \${{ secrets.${p.keyName} }}`)
        ];
        setExportedText(lines.join('\n'));
      }
    } catch (err: any) {
      setExportedText(`# Export error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="text-amber-600" size={18} />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Environment Variable Exporter
          </h3>
        </div>
        <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1 font-semibold">
          <Lock size={10} className="text-emerald-600" /> In-Memory Decryption
        </span>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-700">Export Format</label>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {(
            [
              { id: 'env', label: '.env File' },
              { id: 'vercel', label: 'Vercel JSON' },
              { id: 'github', label: 'GitHub CI' }
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFormat(f.id);
                setExportedText('');
              }}
              className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                format === f.id ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
      >
        <FileCode size={14} className="text-amber-400" />
        <span>Generate {format.toUpperCase()} Credentials Export</span>
      </button>

      {exportedText && (
        <div className="relative space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1 text-amber-700 font-bold">
              <ShieldAlert size={11} /> Decrypted in memory for export only
            </span>
          </div>

          <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-48 custom-scrollbar shadow-inner">
            <code>{exportedText}</code>
          </pre>

          <button
            onClick={handleCopy}
            className="absolute top-7 right-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 p-1.5 rounded-md text-xs transition-all active:scale-95 flex items-center gap-1"
            title="Copy export"
          >
            {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      )}
    </div>
  );
};
