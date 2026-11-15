// The provider app runs beside this one: port 5174 in dev, its own Vercel site when deployed
// (docs/deploy.md). Override with VITE_PROVIDER_URL.
const DEPLOYED_PROVIDER_URL = "https://cancer-care-dashboard.vercel.app/";
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

export const PROVIDER_URL =
  (import.meta.env.VITE_PROVIDER_URL as string | undefined) ??
  (LOCAL_HOSTS.includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:5174/`
    : DEPLOYED_PROVIDER_URL);
