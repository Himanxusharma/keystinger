import { SavedKey, CustomProvider, CapturedExchange } from '../types';

const KEYS_STORAGE_KEY = 'ks_saved_keys';
const CUSTOM_PROVIDERS_KEY = 'ks_custom_providers';
const EXCHANGES_KEY = 'ks_captured_exchanges';
const MAX_EXCHANGES = 20;

const isChromeStorageAvailable = (): boolean => {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
};

export async function getSavedKeys(): Promise<SavedKey[]> {
  if (isChromeStorageAvailable()) {
    const res = await chrome.storage.local.get([KEYS_STORAGE_KEY]);
    return res[KEYS_STORAGE_KEY] || [];
  } else {
    const data = localStorage.getItem(KEYS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function saveKey(keyRecord: SavedKey): Promise<void> {
  const current = await getSavedKeys();
  const filtered = current.filter(k => k.id !== keyRecord.id);
  const updated = [keyRecord, ...filtered];
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [KEYS_STORAGE_KEY]: updated });
  } else {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(updated));
  }
}

export async function deleteSavedKey(id: string): Promise<void> {
  const current = await getSavedKeys();
  const updated = current.filter(k => k.id !== id);
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [KEYS_STORAGE_KEY]: updated });
  } else {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(updated));
  }
}

export async function getCustomProviders(): Promise<CustomProvider[]> {
  if (isChromeStorageAvailable()) {
    const res = await chrome.storage.local.get([CUSTOM_PROVIDERS_KEY]);
    return res[CUSTOM_PROVIDERS_KEY] || [];
  } else {
    const data = localStorage.getItem(CUSTOM_PROVIDERS_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function saveCustomProvider(provider: CustomProvider): Promise<void> {
  const current = await getCustomProviders();
  const filtered = current.filter(p => p.id !== provider.id);
  const updated = [provider, ...filtered];
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [CUSTOM_PROVIDERS_KEY]: updated });
  } else {
    localStorage.setItem(CUSTOM_PROVIDERS_KEY, JSON.stringify(updated));
  }
}

export async function getCapturedExchanges(): Promise<CapturedExchange[]> {
  if (isChromeStorageAvailable()) {
    const res = await chrome.storage.local.get([EXCHANGES_KEY]);
    return res[EXCHANGES_KEY] || [];
  } else {
    const data = localStorage.getItem(EXCHANGES_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function logExchange(exchange: CapturedExchange): Promise<void> {
  const current = await getCapturedExchanges();
  const updated = [exchange, ...current].slice(0, MAX_EXCHANGES);
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [EXCHANGES_KEY]: updated });
  } else {
    localStorage.setItem(EXCHANGES_KEY, JSON.stringify(updated));
  }
}

export async function clearExchanges(): Promise<void> {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [EXCHANGES_KEY]: [] });
  } else {
    localStorage.setItem(EXCHANGES_KEY, JSON.stringify([]));
  }
}
