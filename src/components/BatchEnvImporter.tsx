import React, { useState } from 'react';
import { FileText, CheckCircle2, Loader2, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { parseEnvFileContent, ExtractedEnvKey } from '../utils/envBatchParser';
import { validateKeyForProvider } from '../adapters/registry';
import { encryptKey, maskApiKey } from '../utils/crypto';
import { saveKey, logExchange } from '../utils/storage';
import { CustomProvider } from '../types';

interface BatchEnvImporterProps {
  customProviders: CustomProvider[];
  onImportComplete: () => void;
}

export const BatchEnvImporter: React.FC<BatchEnvImporterProps> = ({ customProviders, onImportComplete }) => {
  const [envText, setEnvText] = useState<string>('');
  const [extractedKeys, setExtractedKeys] = useState<ExtractedEnvKey[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const handleParseText = () => {
    setImportSummary(null);
    const parsed = parseEnvFileContent(envText);
    setExtractedKeys(parsed);
  };

  const handleBatchValidateAndSave = async () => {
    if (extractedKeys.length === 0 || isProcessing) return;

    setIsProcessing(true);
    let successCount = 0;

    for (let i = 0; i < extractedKeys.length; i++) {
      const item = extractedKeys[i];
      setProgressMsg(`Validating ${i + 1}/${extractedKeys.length}: ${item.variableName}...`);

      try {
        const res = await validateKeyForProvider(item.providerId, item.rawKey, customProviders);
        await logExchange(res.exchange);

        if (res.valid) {
          const { encryptedKey, iv } = await encryptKey(item.rawKey);
          const masked = maskApiKey(item.rawKey);

          await saveKey({
            id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            nickname: item.variableName,
            providerId: item.providerId,
            maskedKey: masked,
            encryptedKey,
            iv,
            createdAt: Date.now(),
            lastCheckedAt: Date.now(),
            status: 'valid',
            modelsCount: res.models.length
          });
          successCount++;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setIsProcessing(false);
    setProgressMsg('');
    setImportSummary(`Batch process complete: ${successCount} of ${extractedKeys.length} keys verified live & saved to Vault!`);
    onImportComplete();
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="text-amber-400" size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Batch .env Importer & Auto-Validator
          </h3>
        </div>
        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono flex items-center gap-1">
          <Sparkles size={10} /> Batch Extractor
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Paste an entire <code className="text-amber-300 font-mono">.env</code> file containing multiple API keys. KeyStinger will automatically parse, validate, and save all live keys in one click.
      </p>

      <textarea
        value={envText}
        onChange={(e) => setEnvText(e.target.value)}
        placeholder={`OPENAI_API_KEY=sk-proj-...\nANTHROPIC_API_KEY=sk-ant-...\nGROQ_API_KEY=gsk_...`}
        rows={4}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 custom-scrollbar"
      />

      <button
        onClick={handleParseText}
        disabled={!envText.trim()}
        className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold py-1.5 rounded-lg text-xs transition-all disabled:opacity-50"
      >
        Parse .env Variables
      </button>

      {extractedKeys.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Extracted Recognized Credentials ({extractedKeys.length})</span>
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar">
            {extractedKeys.map((k, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-xs font-mono">
                <div className="truncate">
                  <span className="text-amber-300 font-bold block truncate">{k.variableName}</span>
                  <span className="text-[10px] text-slate-500">{k.providerName} • {maskApiKey(k.rawKey)}</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-sans border border-emerald-500/20 shrink-0">Ready</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleBatchValidateAndSave}
            disabled={isProcessing}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin text-slate-950" />
                <span className="truncate">{progressMsg}</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                <span>Batch Validate & Save All to Vault</span>
              </>
            )}
          </button>
        </div>
      )}

      {importSummary && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{importSummary}</span>
        </div>
      )}
    </div>
  );
};
