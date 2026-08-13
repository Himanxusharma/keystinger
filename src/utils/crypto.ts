// WebCrypto AES-GCM encryption and key masking utilities for KeyStinger

let memoryKey: CryptoKey | null = null;

async function getMasterKey(): Promise<CryptoKey> {
  if (memoryKey) return memoryKey;

  // Retrieve or initialize extension instance salt
  let saltStr: string | undefined = undefined;
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const data = await chrome.storage.local.get(['ks_master_salt']);
    if (data.ks_master_salt) {
      saltStr = data.ks_master_salt;
    } else {
      const newSalt = crypto.getRandomValues(new Uint8Array(16));
      saltStr = Array.from(newSalt).map(b => b.toString(16).padStart(2, '0')).join('');
      await chrome.storage.local.set({ ks_master_salt: saltStr });
    }
  } else {
    saltStr = 'keystinger_local_default_salt_2026';
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(saltStr),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  memoryKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('keystinger_aes_gcm_salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return memoryKey;
}

export async function encryptKey(plainKey: string): Promise<{ encryptedKey: string; iv: string }> {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encoded = encoder.encode(plainKey);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const encryptedArr = new Uint8Array(encryptedBuffer);
  const encryptedBase64 = btoa(String.fromCharCode(...encryptedArr));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    encryptedKey: encryptedBase64,
    iv: ivBase64
  };
}

export async function decryptKey(encryptedBase64: string, ivBase64: string): Promise<string> {
  const key = await getMasterKey();
  
  const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    encryptedBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

export function maskApiKey(rawKey: string): string {
  if (!rawKey) return '';
  const trimmed = rawKey.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefixEnd = trimmed.indexOf('-') > 0 ? trimmed.indexOf('-') + 1 : 4;
  const prefix = trimmed.slice(0, Math.min(prefixEnd, 6));
  const suffix = trimmed.slice(-4);
  return `${prefix}••••${suffix}`;
}
