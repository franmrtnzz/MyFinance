export const NOW_OVERRIDE_KEY = 'simulatedNow';

export function getNow(): Date {
  try {
    const iso = localStorage.getItem(NOW_OVERRIDE_KEY);
    if (iso) {
      const d = new Date(iso);
      if (!isNaN(d.getTime())) return d;
    }
  } catch {}
  return new Date();
}

export function setNowOverride(iso: string | null) {
  if (!iso) {
    localStorage.removeItem(NOW_OVERRIDE_KEY);
    return;
  }
  const d = new Date(iso);
  if (!isNaN(d.getTime())) localStorage.setItem(NOW_OVERRIDE_KEY, d.toISOString());
}
