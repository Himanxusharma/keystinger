import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle, Loader2, Sparkles, BookmarkPlus, ExternalLink } from 'lucide-react';
import { ProviderDefinition, CustomProvider, ValidationResult } from '../types';
import { BUILTIN_PROVIDERS, autoDetectProviderId, validateKeyForProvider } from '../adapters/registry';
import { maskApiKey, encryptKey } from '../utils/crypto';
import { saveKey, logExchange } from '../utils/storage';

interface ValidateFormProps {
  customProviders: CustomProvider[];
  onValidationComplete: (result: ValidationResult, providerId: string) => void;
  onKeySaved: () => void;
}

export const ValidateForm: React.FC<ValidateFormProps> = ({
  customProviders,
  onValidationComplete,
  onKeySaved
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [autoDetected, setAutoDetected] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Auto-detect provider prefix on key typing
  useEffect(() => {
    if (!apiKey) {
      setAutoDetected(null);
      return;
    }
    const detected = autoDetectProviderId(apiKey);
    if (detected && detected !== selectedProviderId) {
      setAutoDetected(detected);
      setSelectedProviderId(detected);
    } else if (detected) {
      setAutoDetected(detected);
    } else {
      setAutoDetected(null);
    }
  }, [apiKey]);

  const allProviders: ProviderDefinition[] = [
    ...BUILTIN_PROVIDERS,
    ...customProviders.map(cp => ({
      id: cp.id,
      displayName: `${cp.label} (Custom)`,
      baseUrl: cp.baseUrl,
      keyPrefixes: [],
      docUrl: undefined,
      isCustom: true
    }))
  ];

  const currentProvider = allProviders.find(p => p.id === selectedProviderId) || BUILTIN_PROVIDERS[0];

  const handleValidate = async () => {
    if (!apiKey.trim()) return;

    setIsLoading(true);
    setResult(null);
    setIsSaved(false);

    try {
      const res = await validateKeyForProvider(selectedProviderId, apiKey.trim(), customProviders);
      setResult(res);
      await logExchange(res.exchange);
      onValidationComplete(res, selectedProviderId);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!apiKey.trim() || !result) return;
    const { encryptedKey, iv } = await encryptKey(apiKey.trim());
    const masked = maskApiKey(apiKey.trim());

    await saveKey({
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nickname: nickname.trim() || `${currentProvider.displayName} Key`,
      providerId: selectedProviderId,
      maskedKey: masked,
      encryptedKey,
      iv,
      createdAt: Date.now(),
      lastCheckedAt: Date.now(),
      status: result.valid ? 'valid' : 'invalid',
      modelsCount: result.models.length
    });

    setIsSaved(true);
    onKeySaved();
  };

  return (
    <div className="space-y-4">
      {/* Provider Selector */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-300">Target AI Provider</label>
          {currentProvider.docUrl && (
            <a
              href={currentProvider.docUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Get Key <ExternalLink size={10} />
            </a>
          )}
        </div>
        <select
          value={selectedProviderId}
          onChange={(e) => setSelectedProviderId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
        >
          <optgroup label="Built-in Matrix">
            {BUILTIN_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </optgroup>
          {customProviders.length > 0 && (
            <optgroup label="Custom Providers (Pasted cURL)">
              {customProviders.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.label}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* API Key Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-300">API Key Credential</label>
          {autoDetected && (
            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
              <Sparkles size={10} /> Auto-detected prefix
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Paste ${currentProvider.displayName} API Key...`}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-3 pr-10 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleValidate}
        disabled={isLoading || !apiKey.trim()}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs shadow-md shadow-amber-500/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={15} className="animate-spin text-slate-950" />
            <span>Validating with Provider...</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={15} />
            <span>Validate & Discover Models</span>
          </>
        )}
      </button>

      {/* Validation Result Banner */}
      {result && (
        <div className={`p-3.5 rounded-xl border transition-all ${
          result.valid
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : result.statusCode === 429
            ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {result.valid ? (
                <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
              ) : result.statusCode === 429 ? (
                <AlertTriangle className="text-amber-400 shrink-0" size={18} />
              ) : (
                <XCircle className="text-rose-400 shrink-0" size={18} />
              )}
              <div>
                <h4 className="text-xs font-bold leading-tight">
                  {result.valid
                    ? 'API Key Verified Live'
                    : result.statusCode === 429
                    ? 'Rate Limited (429)'
                    : `Validation Failed (${result.statusCode || 'Error'})`}
                </h4>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {result.valid
                    ? `Found ${result.models.length} model entitlement(s) in ${result.durationMs}ms.`
                    : result.error?.message || 'Verification call rejected by provider API.'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700 shrink-0">
              {result.durationMs}ms
            </span>
          </div>

          {/* Optional Save to Vault Action */}
          {result.valid && (
            <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Key Nickname (e.g. Prod OpenAI)"
                className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleSaveToVault}
                disabled={isSaved}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-60"
              >
                <BookmarkPlus size={13} />
                <span>{isSaved ? 'Saved!' : 'Save Key'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
