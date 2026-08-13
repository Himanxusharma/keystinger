import { SavedKey, CustomProvider, CapturedExchange, RequestTemplate, VaultBackupExport } from '../types';

const KEYS_STORAGE_KEY = 'ks_saved_keys';
const CUSTOM_PROVIDERS_KEY = 'ks_custom_providers';
const EXCHANGES_KEY = 'ks_captured_exchanges';
const TEMPLATES_KEY = 'ks_request_templates';
const MAX_EXCHANGES = 20;

const memoryStore = new Map<string, any>();

const isChromeStorageAvailable = (): boolean => {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
};

const isLocalStorageAvailable = (): boolean => {
  return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';
};

async function getItem<T>(key: string): Promise<T[]> {
  if (isChromeStorageAvailable()) {
    const res = await chrome.storage.local.get([key]);
    return res[key] || [];
  } else if (isLocalStorageAvailable()) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } else {
    return memoryStore.get(key) || [];
  }
}

async function setItem<T>(key: string, value: T[]): Promise<void> {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [key]: value });
  } else if (isLocalStorageAvailable()) {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    memoryStore.set(key, value);
  }
}

export async function getSavedKeys(): Promise<SavedKey[]> {
  return getItem<SavedKey>(KEYS_STORAGE_KEY);
}

export async function saveKey(keyRecord: SavedKey): Promise<void> {
  const current = await getSavedKeys();
  const filtered = current.filter(k => k.id !== keyRecord.id);
  await setItem(KEYS_STORAGE_KEY, [keyRecord, ...filtered]);
}

export async function deleteSavedKey(id: string): Promise<void> {
  const current = await getSavedKeys();
  const updated = current.filter(k => k.id !== id);
  await setItem(KEYS_STORAGE_KEY, updated);
}

export async function getCustomProviders(): Promise<CustomProvider[]> {
  return getItem<CustomProvider>(CUSTOM_PROVIDERS_KEY);
}

export async function saveCustomProvider(provider: CustomProvider): Promise<void> {
  const current = await getCustomProviders();
  const filtered = current.filter(p => p.id !== provider.id);
  await setItem(CUSTOM_PROVIDERS_KEY, [provider, ...filtered]);
}

export async function getCapturedExchanges(): Promise<CapturedExchange[]> {
  return getItem<CapturedExchange>(EXCHANGES_KEY);
}

export async function logExchange(exchange: CapturedExchange): Promise<void> {
  const current = await getCapturedExchanges();
  const updated = [exchange, ...current].slice(0, MAX_EXCHANGES);
  await setItem(EXCHANGES_KEY, updated);
}

export async function clearExchanges(): Promise<void> {
  await setItem(EXCHANGES_KEY, []);
}

// Phase 2: Request Templates
export async function getRequestTemplates(): Promise<RequestTemplate[]> {
  return getItem<RequestTemplate>(TEMPLATES_KEY);
}

export async function saveRequestTemplate(template: RequestTemplate): Promise<void> {
  const current = await getRequestTemplates();
  const filtered = current.filter(t => t.id !== template.id);
  await setItem(TEMPLATES_KEY, [template, ...filtered]);
}

export async function deleteRequestTemplate(id: string): Promise<void> {
  const current = await getRequestTemplates();
  const updated = current.filter(t => t.id !== id);
  await setItem(TEMPLATES_KEY, updated);
}

// Phase 2: Encrypted Vault Export & Import
export async function exportVaultData(): Promise<VaultBackupExport> {
  const savedKeys = await getSavedKeys();
  const customProviders = await getCustomProviders();
  const requestTemplates = await getRequestTemplates();

  return {
    version: '1.0.0',
    exportedAt: Date.now(),
    savedKeys,
    customProviders,
    requestTemplates
  };
}

export async function importVaultData(data: VaultBackupExport): Promise<void> {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid vault backup file.');
  }

  if (Array.isArray(data.savedKeys)) {
    const current = await getSavedKeys();
    const map = new Map<string, SavedKey>();
    current.forEach(k => map.set(k.id, k));
    data.savedKeys.forEach(k => map.set(k.id, k));
    await setItem(KEYS_STORAGE_KEY, Array.from(map.values()));
  }

  if (Array.isArray(data.customProviders)) {
    const current = await getCustomProviders();
    const map = new Map<string, CustomProvider>();
    current.forEach(p => map.set(p.id, p));
    data.customProviders.forEach(p => map.set(p.id, p));
    await setItem(CUSTOM_PROVIDERS_KEY, Array.from(map.values()));
  }

  if (Array.isArray(data.requestTemplates)) {
    const current = await getRequestTemplates();
    const map = new Map<string, RequestTemplate>();
    current.forEach(t => map.set(t.id, t));
    data.requestTemplates.forEach(t => map.set(t.id, t));
    await setItem(TEMPLATES_KEY, Array.from(map.values()));
  }
}
