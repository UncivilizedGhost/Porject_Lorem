// One random id per browser, sent as X-Client-Id; the server admits a few browsers at a time.
const KEY = "demo-client-id";

let cached: string | null = null;

export function clientId(): string {
  if (cached) return cached;
  try {
    cached = localStorage.getItem(KEY);
    if (!cached) {
      cached = crypto.randomUUID();
      localStorage.setItem(KEY, cached);
    }
  } catch {
    cached ??= crypto.randomUUID();
  }
  return cached;
}
