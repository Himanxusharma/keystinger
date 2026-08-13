import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle, Loader2, Sparkles, BookmarkPlus, ExternalLink, Zap, Lock, Gift } from 'lucide-react';
import { ProviderDefinition, CustomProvider, ValidationResult } from '../types';
import { BUILTIN_PROVIDERS, autoDetectProviderId, validateKeyForProvider } from '../adapters/registry';
import { maskApiKey, encryptKey } from '../utils/crypto';
import { saveKey, logExchange } from '../utils/storage';
import { parseRateLimitHeaders, RateLimitInfo } from '../utils/rateLimitDecoder';

interface ValidateFormProps {
  customProviders: CustomProvider[];
  onValidationComplete: (result: ValidationResult, providerId: string) => void;
  onKeySaved: () => void;
  onOpenFreeTierGuide?: () => void;
}

export const ValidateForm: React.FC<ValidateFormProps> = ({
  customProviders,
  onValidationComplete,
  onKeySaved,
  onOpenFreeTierGuide
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [autoDetected, setAutoDetected] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
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
      statusPageUrl: undefined,
      isCustom: true
    }))
  ];

  const currentProvider = allProviders.find(p => p.id === selectedProviderId) || BUILTIN_PROVIDERS[0];

  const handleValidate = async () => {
    if (!apiKey.trim()) return;

    setIsLoading(true);
    setResult(null);
    setRateLimitInfo(null);
    setIsSaved(false);

    try {
      const res = await validateKeyForProvider(selectedProviderId, apiKey.trim(), customProviders);
      setResult(res);

      if (res.exchange?.response?.headers) {
        const rl = parseRateLimitHeaders(res.exchange.response.headers);
        setRateLimitInfo(rl);
      }

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
      {/* Security & Privacy Trust Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-[11px] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Lock size={12} />
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">100% On-Device & AES-256 Encrypted</span>
            <span className="text-[10px] text-slate-500">Zero cloud proxy • Direct browser fetch</span>
          </div>
        </div>
        <span className="text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
          Local Storage
        </span>
      </div>

      {/* Provider Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-800">Target AI Provider</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenFreeTierGuide}
              className="text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all"
              title="View free API keys, daily limits & trial credit directory"
            >
              <Gift size={11} />
              <span>Free Keys & Limits</span>
            </button>
            {currentProvider.docUrl && (
              <a
                href={currentProvider.docUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                Get Key <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
        <select
          value={selectedProviderId}
          onChange={(e) => setSelectedProviderId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
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

        {/* API Key Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-800">API Key Credential</label>
            {autoDetected && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
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
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3 pr-10 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleValidate}
          disabled={isLoading || !apiKey.trim()}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      </div>

      {/* Validation Result Banner */}
      {result && (
        <div className={`p-3.5 rounded-2xl border transition-all space-y-2.5 shadow-sm ${
          result.valid
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
            : result.statusCode === 429
            ? 'bg-amber-50/90 border-amber-200 text-amber-950'
            : 'bg-rose-50/90 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {result.valid ? (
                <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
              ) : result.statusCode === 429 ? (
                <AlertTriangle className="text-amber-600 shrink-0" size={18} />
              ) : (
                <XCircle className="text-rose-600 shrink-0" size={18} />
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
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 shrink-0">
              {result.durationMs}ms
            </span>
          </div>

          {/* Rate-Limit Header Badge Callout */}
          {rateLimitInfo && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-white p-2 rounded-xl border border-slate-200 text-slate-800">
              <Zap size={12} className="text-amber-600 shrink-0" />
              <span className="truncate">{rateLimitInfo.message}</span>
            </div>
          )}

          {/* Live Status Shortcut for Failures/Outages */}
          {(!result.valid || result.statusCode >= 500 || result.statusCode === 429) && currentProvider.statusPageUrl && (
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] text-slate-600 font-medium">Suspecting a provider outage?</span>
              <a
                href={currentProvider.statusPageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1 shadow-xs"
              >
                <span>Check {currentProvider.displayName} Live Status</span>
                <ExternalLink size={10} />
              </a>
            </div>
          )}

          {/* Optional Save to Vault Action */}
          {result.valid && (
            <div className="pt-2 border-t border-emerald-200 flex items-center gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Key Nickname (e.g. Prod OpenAI)"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleSaveToVault}
                disabled={isSaved}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-60 shadow-sm"
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
