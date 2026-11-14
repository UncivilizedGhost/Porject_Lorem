// The provider app runs beside this one (dev: port 5174). Override with VITE_PROVIDER_URL.
export const PROVIDER_URL =
  (import.meta.env.VITE_PROVIDER_URL as string | undefined) ??
  `${window.location.protocol}//${window.location.hostname}:5174/`;
