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
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-amber-600" size={18} />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Vault Health Analytics
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportBackup}
              className="text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-lg transition-all flex items-center gap-1 shadow-xs"
              title="Export Encrypted Vault Backup JSON"
            >
              <Download size={11} className="text-amber-600" />
              <span>Export</span>
            </button>

            <label className="text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-xs">
              <Upload size={11} className="text-amber-600" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Health Counters Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
            <span className="text-[10px] text-slate-500 font-sans block uppercase font-bold">Total</span>
            <span className="text-sm font-black text-slate-900">{totalKeys}</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
            <span className="text-[10px] text-emerald-700 font-sans block uppercase font-bold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Valid
            </span>
            <span className="text-sm font-black text-emerald-800">{validCount}</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2">
            <span className="text-[10px] text-amber-800 font-sans block uppercase font-bold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Limited
            </span>
            <span className="text-sm font-black text-amber-900">{limitedCount}</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2">
            <span className="text-[10px] text-rose-700 font-sans block uppercase font-bold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Invalid
            </span>
            <span className="text-sm font-black text-rose-800">{invalidCount}</span>
          </div>
        </div>

        {/* Bulk Re-Check Button */}
        <button
          onClick={handleBulkRecheckAll}
          disabled={savedKeys.length === 0 || isBulkAuditing}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={13} className={`text-amber-400 ${isBulkAuditing ? 'animate-spin' : ''}`} />
          <span>{isBulkAuditing ? bulkAuditProgress : 'Re-Check All Keys Live'}</span>
        </button>
      </div>

      {importMessage && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
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
            className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-500 shadow-xs"
        >
          <option value="all">All Status</option>
          <option value="valid">Valid Only</option>
          <option value="ratelimited">Limited Only</option>
          <option value="invalid">Invalid Only</option>
        </select>
      </div>

      {/* Saved Keys Grid List */}
      {filteredKeys.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2 shadow-xs">
          <ShieldCheck size={28} className="mx-auto text-slate-300" />
          <p className="text-xs text-slate-500 font-medium">
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
                className="bg-white hover:bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-3 transition-all duration-150 shadow-sm group"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 leading-none">
                        {k.nickname}
                      </h4>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800">
                        {providerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <code className="text-[11px] font-mono text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                        {k.maskedKey}
                      </code>

                      <span
                        className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded-md border ${
                          isOld
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isOld ? `🔐 Rotation Due (${ageDays}d)` : `${ageDays}d old`}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator Pill */}
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1.5 border shadow-xs ${
                    k.status === 'valid' || !k.status
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : k.status === 'ratelimited'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      k.status === 'valid' || !k.status
                        ? 'bg-emerald-500 animate-pulse'
                        : k.status === 'ratelimited'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}></span>
                    <span>{k.status || 'valid'}</span>
                  </div>
                </div>

                {/* Footer Action Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Layers size={12} className="text-amber-600" />
                    <span>{k.modelsCount || 0} Models Entitled</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyDecryptedKey(k)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                      title="Decrypt and Copy API Key"
                    >
                      {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span className="text-[10px] font-bold">{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleAuditKey(k)}
                      disabled={isAuditing}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50 shadow-xs"
                      title="Re-Check Live Health"
                    >
                      <RefreshCw size={13} className={`text-amber-600 ${isAuditing ? 'animate-spin' : ''}`} />
                      <span className="text-[10px] font-bold">Check</span>
                    </button>

                    <button
                      onClick={() => handleDelete(k.id)}
                      className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-300 hover:border-rose-200 rounded-lg transition-all active:scale-95 shadow-xs"
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
