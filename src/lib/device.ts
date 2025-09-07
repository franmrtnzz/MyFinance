export function getDeviceId(): string {
  try {
    const key = 'DEVICE_ID';
    let id = localStorage.getItem(key);
    const fingerprintId = computeFingerprintId();
    if (!id) {
      id = fingerprintId;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    // If localStorage is unavailable, fall back to deterministic fingerprint
    try {
      return computeFingerprintId();
    } catch {
      return 'unknown-device';
    }
  }
}

function computeFingerprintId(): string {
  const nav = window.navigator as any;
  const parts = [
    nav.userAgent || '',
    nav.platform || '',
    nav.language || '',
    String(nav.hardwareConcurrency || ''),
    String(nav.deviceMemory || ''),
    String(nav.maxTouchPoints || ''),
    String(window.devicePixelRatio || ''),
    String(screen.width || ''),
    String(screen.height || ''),
    String(screen.colorDepth || ''),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  ];
  const input = parts.join('|');
  const hex = fnv1a64Hex(input);
  // Expand to 128-bit style by hashing again with a salt and concatenating
  const hex2 = fnv1a64Hex(input + '#2');
  const full = (hex + hex2).padEnd(32, '0').slice(0, 32);
  // Format as UUID-like string
  return `${full.slice(0, 8)}-${full.slice(8, 12)}-${full.slice(12, 16)}-${full.slice(16, 20)}-${full.slice(20)}`;
}

function fnv1a64Hex(str: string): string {
  // 64-bit FNV-1a hash implemented with 32-bit ops (two 32-bit halves)
  let h1 = 0x811c9dc5 | 0; // offset basis low
  let h2 = 0x811c9dc5 | 0; // offset basis high (re-using constant for simplicity)
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 ^= c;
    // FNV prime 64: 1099511628211 -> split into 32-bit parts approx
    // Multiply by prime using 32-bit operations
    const a = (h1 & 0xffff) * 0x013b;
    const b = (h1 >>> 16) * 0x013b;
    h1 = ((a + ((b & 0xffff) << 16)) | 0) ^ h2;
    // mix high
    h2 ^= ((h2 << 5) + (h2 >>> 2) + c) | 0;
  }
  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return toHex(h2) + toHex(h1);
}
