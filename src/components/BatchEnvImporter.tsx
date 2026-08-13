import React, { useState } from 'react';
import { FileText, CheckCircle2, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
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
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="text-amber-600" size={18} />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Batch .env Importer & Auto-Validator
          </h3>
        </div>
        <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
          <Sparkles size={10} /> Batch Extractor
        </span>
      </div>

      <p className="text-xs text-slate-600 font-medium">
        Paste an entire <code className="text-amber-800 font-mono font-bold bg-amber-50 px-1 py-0.2 rounded border border-amber-200">.env</code> file containing multiple API keys. KeyStinger will automatically parse, validate, and save all live keys in one click.
      </p>

      <textarea
        value={envText}
        onChange={(e) => setEnvText(e.target.value)}
        placeholder={`OPENAI_API_KEY=sk-proj-...\nANTHROPIC_API_KEY=sk-ant-...\nGROQ_API_KEY=gsk_...`}
        rows={4}
        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 custom-scrollbar shadow-inner"
      />

      <button
        onClick={handleParseText}
        disabled={!envText.trim()}
        className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold py-1.5 rounded-xl text-xs transition-all disabled:opacity-50 shadow-xs"
      >
        Parse .env Variables
      </button>

      {extractedKeys.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Extracted Recognized Credentials ({extractedKeys.length})</span>
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar">
            {extractedKeys.map((k, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between text-xs font-mono">
                <div className="truncate">
                  <span className="text-slate-900 font-bold block truncate">{k.variableName}</span>
                  <span className="text-[10px] text-slate-500">{k.providerName} • {maskApiKey(k.rawKey)}</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md font-sans border border-emerald-200 shrink-0">Ready</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleBatchValidateAndSave}
            disabled={isProcessing}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
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
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{importSummary}</span>
        </div>
      )}
    </div>
  );
};
