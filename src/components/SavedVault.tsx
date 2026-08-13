import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RefreshCw, Trash2, Copy, Check, Lock, Loader2, Download, Upload, Search, Filter } from 'lucide-react';
import { SavedKey, CustomProvider } from '../types';
import { getSavedKeys, deleteSavedKey, saveKey, logExchange, exportVaultData, importVaultData } from '../utils/storage';
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
  
  const [isBulkChecking, setIsBulkChecking] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'invalid' | 'ratelimited'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleBulkRecheck = async () => {
    if (savedKeys.length === 0 || isBulkChecking) return;
    setIsBulkChecking(true);

    for (let i = 0; i < savedKeys.length; i++) {
      const keyRecord = savedKeys[i];
      setBulkProgress(`Auditing ${i + 1}/${savedKeys.length}: ${keyRecord.nickname}...`);
      await handleRecheckKey(keyRecord);
    }

    setIsBulkChecking(false);
    setBulkProgress('');
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

  const handleExportVault = async () => {
    const backup = await exportVaultData();
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `keystinger-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      await importVaultData(backup);
      await loadKeys();
      onKeysChanged();
      alert('Vault backup imported successfully!');
    } catch (err: any) {
      alert(`Import failed: ${err.message || 'Invalid JSON backup file.'}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getProviderName = (providerId: string): string => {
    const builtin = BUILTIN_PROVIDERS.find((p) => p.id === providerId);
    if (builtin) return builtin.displayName;
    const custom = customProviders.find((p) => p.id === providerId);
    if (custom) return custom.label;
    return providerId;
  };

  // Statistics calculation
  const totalCount = savedKeys.length;
  const validCount = savedKeys.filter((k) => k.status === 'valid' || !k.status).length;
  const ratelimitedCount = savedKeys.filter((k) => k.status === 'ratelimited').length;
  const invalidCount = savedKeys.filter((k) => k.status === 'invalid' || k.status === 'error').length;

  // Filtered keys
  const filteredKeys = savedKeys.filter((k) => {
    const matchesSearch =
      k.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProviderName(k.providerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.maskedKey.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'valid'
        ? k.status === 'valid' || !k.status
        : statusFilter === 'ratelimited'
        ? k.status === 'ratelimited'
        : k.status === 'invalid' || k.status === 'error';

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-amber-400" size={18} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Encrypted Vault ({totalCount})
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportVault}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1"
            title="Export Encrypted Vault Backup"
          >
            <Download size={12} /> Backup
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1"
            title="Import Encrypted Vault Backup"
          >
            <Upload size={12} /> Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </div>

      {/* Key Health Statistics Bar */}
      {totalCount > 0 && (
        <div className="grid grid-cols-4 gap-1.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center font-mono">
          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">Total</span>
            <span className="text-xs font-bold text-white">{totalCount}</span>
          </div>
          <div className="bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 block font-sans">Valid</span>
            <span className="text-xs font-bold text-emerald-300">{validCount}</span>
          </div>
          <div className="bg-amber-950/40 p-1.5 rounded-lg border border-amber-500/30">
            <span className="text-[10px] text-amber-400 block font-sans">Limited</span>
            <span className="text-xs font-bold text-amber-300">{ratelimitedCount}</span>
          </div>
          <div className="bg-rose-950/40 p-1.5 rounded-lg border border-rose-500/30">
            <span className="text-[10px] text-rose-400 block font-sans">Invalid</span>
            <span className="text-xs font-bold text-rose-300">{invalidCount}</span>
          </div>
        </div>
      )}

      {/* Bulk Audit & Search Controls */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkRecheck}
              disabled={isBulkChecking}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 font-bold py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isBulkChecking ? (
                <>
                  <Loader2 size={13} className="animate-spin text-amber-400" />
                  <span className="truncate">{bulkProgress}</span>
                </>
              ) : (
                <>
                  <RefreshCw size={13} className="text-amber-400" />
                  <span>Bulk Re-Check All Keys ({totalCount})</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search keys..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">All</option>
              <option value="valid">Valid</option>
              <option value="ratelimited">Limited</option>
              <option value="invalid">Invalid</option>
            </select>
          </div>
        </div>
      )}

      {/* Saved Keys List */}
      {filteredKeys.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center space-y-2">
          <Lock size={24} className="mx-auto text-slate-600" />
          <p className="text-xs font-medium text-slate-400">
            {totalCount === 0 ? 'No saved keys in your local vault yet.' : 'No keys match the current filter.'}
          </p>
          <p className="text-[11px] text-slate-500">
            {totalCount === 0
              ? 'Validate an API key on the home tab and click "Save Key" to track it here securely.'
              : 'Try clearing the search term or status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredKeys.map((k) => {
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
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{k.maskedKey}</span>
                      {(() => {
                        const ageDays = Math.floor((Date.now() - (k.createdAt || Date.now())) / (1000 * 60 * 60 * 24));
                        const isOld = ageDays >= 60;
                        return (
                          <span
                            className={`text-[9px] font-sans font-semibold px-1.5 py-0.2 rounded border ${
                              isOld
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isOld ? `🔐 Rotation Due (${ageDays}d)` : `${ageDays}d old`}
                          </span>
                        );
                      })()}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      k.status === 'valid' || !k.status
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
                      disabled={isRechecking || isBulkChecking}
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
