import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { SavedKey, CustomProvider, VaultBackupExport } from '../types';
import { decryptKey } from '../utils/crypto';
import { deleteSavedKey, saveKey, exportVaultData, importVaultData } from '../utils/storage';
import { validateKeyForProvider, BUILTIN_PROVIDERS } from '../adapters/registry';

interface SavedVaultProps {
  savedKeys: SavedKey[];
  customProviders: CustomProvider[];
  onKeysChanged: () => void;
}

type StatusFilter = 'all' | 'valid' | 'ratelimited' | 'invalid';

export const SavedVault: React.FC<SavedVaultProps> = ({
  savedKeys,
  customProviders,
  onKeysChanged
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [isBulkAuditing, setIsBulkAuditing] = useState<boolean>(false);
  const [bulkAuditProgress, setBulkAuditProgress] = useState<string>('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Statistics calculation
  const totalKeys = savedKeys.length;
  const validCount = savedKeys.filter((k) => k.status === 'valid' || !k.status).length;
  const limitedCount = savedKeys.filter((k) => k.status === 'ratelimited').length;
  const invalidCount = savedKeys.filter((k) => k.status === 'invalid').length;

  const allProviders = [
    ...BUILTIN_PROVIDERS,
    ...customProviders.map((cp) => ({
      id: cp.id,
      displayName: cp.label,
      baseUrl: cp.baseUrl,
      keyPrefixes: []
    }))
  ];

  const filteredKeys = savedKeys.filter((k) => {
    const matchesSearch =
      k.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.maskedKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.providerId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'valid'
        ? k.status === 'valid' || !k.status
        : k.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCopyDecryptedKey = async (keyRecord: SavedKey) => {
    try {
      const decrypted = await decryptKey(keyRecord.encryptedKey, keyRecord.iv);
      await navigator.clipboard.writeText(decrypted);
      setCopiedId(keyRecord.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Decryption copy error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSavedKey(id);
    onKeysChanged();
  };

  const handleAuditKey = async (keyRecord: SavedKey) => {
    setAuditingId(keyRecord.id);
    try {
      const decrypted = await decryptKey(keyRecord.encryptedKey, keyRecord.iv);
      const res = await validateKeyForProvider(keyRecord.providerId, decrypted, customProviders);

      const updatedStatus = res.valid ? 'valid' : res.statusCode === 429 ? 'ratelimited' : 'invalid';
      await saveKey({
        ...keyRecord,
        lastCheckedAt: Date.now(),
        status: updatedStatus,
        modelsCount: res.models.length
      });
      onKeysChanged();
    } catch (err) {
      console.error('Audit error:', err);
    } finally {
      setAuditingId(null);
    }
  };

  const handleBulkRecheckAll = async () => {
    if (savedKeys.length === 0 || isBulkAuditing) return;
    setIsBulkAuditing(true);

    for (let i = 0; i < savedKeys.length; i++) {
      const keyRecord = savedKeys[i];
      setBulkAuditProgress(`Auditing ${i + 1}/${savedKeys.length}: ${keyRecord.nickname}...`);
      try {
        const decrypted = await decryptKey(keyRecord.encryptedKey, keyRecord.iv);
        const res = await validateKeyForProvider(keyRecord.providerId, decrypted, customProviders);
        const updatedStatus = res.valid ? 'valid' : res.statusCode === 429 ? 'ratelimited' : 'invalid';

        await saveKey({
          ...keyRecord,
          lastCheckedAt: Date.now(),
          status: updatedStatus,
          modelsCount: res.models.length
        });
      } catch (err) {
        console.error(err);
      }
    }

    setIsBulkAuditing(false);
    setBulkAuditProgress('');
    onKeysChanged();
  };

  const handleExportBackup = async () => {
    const backup = await exportVaultData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keystinger-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as VaultBackupExport;
        await importVaultData(parsed);
        setImportMessage('Vault backup imported successfully!');
        setTimeout(() => setImportMessage(null), 3000);
        onKeysChanged();
      } catch (err: any) {
        setImportMessage(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Top Health Analytics Summary Bar */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-amber-400" size={18} />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Vault Health Analytics
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportBackup}
              className="text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md transition-all flex items-center gap-1"
              title="Export Encrypted Vault Backup JSON"
            >
              <Download size={11} className="text-amber-400" />
              <span>Export</span>
            </button>

            <label className="text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1">
              <Upload size={11} className="text-amber-400" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Health Counters Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Total</span>
            <span className="text-sm font-black text-white">{totalKeys}</span>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-2">
            <span className="text-[10px] text-emerald-400 font-sans block uppercase font-bold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Valid
            </span>
            <span className="text-sm font-black text-emerald-300">{validCount}</span>
          </div>

          <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-2">
            <span className="text-[10px] text-amber-400 font-sans block uppercase font-bold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Limited
            </span>
            <span className="text-sm font-black text-amber-300">{limitedCount}</span>
          </div>

          <div className="bg-rose-950/30 border border-rose-500/20 rounded-xl p-2">
            <span className="text-[10px] text-rose-400 font-sans block uppercase font-bold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Invalid
            </span>
            <span className="text-sm font-black text-rose-300">{invalidCount}</span>
          </div>
        </div>

        {/* Bulk Re-Check Button */}
        <button
          onClick={handleBulkRecheckAll}
          disabled={savedKeys.length === 0 || isBulkAuditing}
          className="w-full bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-300 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={13} className={`text-amber-400 ${isBulkAuditing ? 'animate-spin' : ''}`} />
          <span>{isBulkAuditing ? bulkAuditProgress : 'Re-Check All Keys Live'}</span>
        </button>
      </div>

      {importMessage && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-medium">
          {importMessage}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vault keys..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white font-medium focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Status</option>
          <option value="valid">Valid Only</option>
          <option value="ratelimited">Limited Only</option>
          <option value="invalid">Invalid Only</option>
        </select>
      </div>

      {/* Saved Keys Grid List */}
      {filteredKeys.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <ShieldCheck size={28} className="mx-auto text-slate-600" />
          <p className="text-xs text-slate-400 font-medium">
            {savedKeys.length === 0
              ? 'No saved API keys in vault yet. Validate and save a key to get started!'
              : 'No keys match the selected search or status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredKeys.map((k) => {
            const provider = allProviders.find((p) => p.id === k.providerId);
            const providerName = provider ? provider.displayName : k.providerId;
            const ageDays = Math.floor((Date.now() - (k.createdAt || Date.now())) / (1000 * 60 * 60 * 24));
            const isOld = ageDays >= 60;
            const isAuditing = auditingId === k.id;
            const isCopied = copiedId === k.id;

            return (
              <div
                key={k.id}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-3.5 space-y-3 transition-all duration-150 shadow-md group"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white leading-none">
                        {k.nickname}
                      </h4>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-amber-300">
                        {providerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <code className="text-[11px] font-mono text-slate-300 bg-slate-950 border border-slate-800/90 px-2 py-0.5 rounded-md">
                        {k.maskedKey}
                      </code>

                      <span
                        className={`text-[9px] font-sans font-semibold px-2 py-0.5 rounded-md border ${
                          isOld
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {isOld ? `🔐 Rotation Due (${ageDays}d)` : `${ageDays}d old`}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator Pill */}
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1.5 border shadow-sm ${
                    k.status === 'valid' || !k.status
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : k.status === 'ratelimited'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      k.status === 'valid' || !k.status
                        ? 'bg-emerald-400 animate-pulse'
                        : k.status === 'ratelimited'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}></span>
                    <span>{k.status || 'valid'}</span>
                  </div>
                </div>

                {/* Footer Action Toolbar */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Layers size={12} className="text-amber-400" />
                    <span>{k.modelsCount || 0} Models Entitled</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyDecryptedKey(k)}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-all active:scale-95 flex items-center gap-1"
                      title="Decrypt and Copy API Key"
                    >
                      {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span className="text-[10px] font-semibold">{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleAuditKey(k)}
                      disabled={isAuditing}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 rounded-lg transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50"
                      title="Re-Check Live Health"
                    >
                      <RefreshCw size={13} className={`text-amber-400 ${isAuditing ? 'animate-spin' : ''}`} />
                      <span className="text-[10px] font-semibold">Check</span>
                    </button>

                    <button
                      onClick={() => handleDelete(k.id)}
                      className="p-1.5 bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 rounded-lg transition-all active:scale-95"
                      title="Delete Key from Vault"
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
