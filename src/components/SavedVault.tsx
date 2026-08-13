import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Trash2, Copy, Check, Lock, Loader2, Sparkles } from 'lucide-react';
import { SavedKey, CustomProvider } from '../types';
import { getSavedKeys, deleteSavedKey, saveKey, logExchange } from '../utils/storage';
import { decryptKey } from '../utils/crypto';
import { BUILTIN_PROVIDERS, validateKeyForProvider } from '../adapters/registry';

interface SavedVaultProps {
  customProviders: CustomProvider[];
  onKeysChanged: () => void;
}

export const SavedVault: React.FC<SavedVaultProps> = ({ customProviders, onKeysChanged }) => {
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadKeys = async () => {
    const keys = await getSavedKeys();
    setSavedKeys(keys);
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleRecheckKey = async (keyRecord: SavedKey) => {
    setLoadingIds((prev) => ({ ...prev, [keyRecord.id]: true }));
    try {
      const decrypted = await decryptKey(keyRecord.encryptedKey, keyRecord.iv);
      const res = await validateKeyForProvider(keyRecord.providerId, decrypted, customProviders);

      await logExchange(res.exchange);

      const updatedRecord: SavedKey = {
        ...keyRecord,
        lastCheckedAt: Date.now(),
        status: res.valid ? 'valid' : res.statusCode === 429 ? 'ratelimited' : 'invalid',
        modelsCount: res.models.length
      };

      await saveKey(updatedRecord);
      await loadKeys();
      onKeysChanged();
    } catch (e) {
      console.error('Re-check failed:', e);
    } finally {
      setLoadingIds((prev) => ({ ...prev, [keyRecord.id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSavedKey(id);
    await loadKeys();
    onKeysChanged();
  };

  const handleCopyDecrypted = async (keyRecord: SavedKey) => {
    try {
      const decrypted = await decryptKey(keyRecord.encryptedKey, keyRecord.iv);
      await navigator.clipboard.writeText(decrypted);
      setCopiedId(keyRecord.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to decrypt key:', e);
    }
  };

  const getProviderName = (providerId: string): string => {
    const builtin = BUILTIN_PROVIDERS.find((p) => p.id === providerId);
    if (builtin) return builtin.displayName;
    const custom = customProviders.find((p) => p.id === providerId);
    if (custom) return custom.label;
    return providerId;
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-amber-400" size={18} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Encrypted Key Vault ({savedKeys.length})
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
          <Lock size={10} className="text-emerald-400" /> AES-GCM Encrypted
        </span>
      </div>

      {savedKeys.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center space-y-2">
          <Lock size={24} className="mx-auto text-slate-600" />
          <p className="text-xs font-medium text-slate-400">No saved keys in your local vault yet.</p>
          <p className="text-[11px] text-slate-500">
            Validate an API key on the home tab and click "Save Key" to track it here securely.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {savedKeys.map((k) => {
            const isRechecking = Boolean(loadingIds[k.id]);
            const providerName = getProviderName(k.providerId);

            return (
              <div
                key={k.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 shadow-sm transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {k.nickname}
                      <span className="text-[10px] font-normal text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                        {providerName}
                      </span>
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{k.maskedKey}</p>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      k.status === 'valid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : k.status === 'ratelimited'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {k.status || 'valid'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                  <span>
                    Checked: {k.lastCheckedAt ? new Date(k.lastCheckedAt).toLocaleTimeString() : 'Never'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRecheckKey(k)}
                      disabled={isRechecking}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-amber-400 transition-colors"
                      title="Re-check status"
                    >
                      {isRechecking ? (
                        <Loader2 size={13} className="animate-spin text-amber-400" />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                    </button>

                    <button
                      onClick={() => handleCopyDecrypted(k)}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-emerald-400 transition-colors"
                      title="Decrypt & Copy to Clipboard"
                    >
                      {copiedId === k.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>

                    <button
                      onClick={() => handleDelete(k.id)}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-rose-400 transition-colors"
                      title="Delete from Vault"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
