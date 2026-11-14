import { useEffect, useState } from "react";

// Worklist, dashboard and the SMS/FHIR log poll the server every few seconds (no websockets).
// Also re-runs when the demo bar emits "demo-day-advanced".
export function usePolling<T>(fetcher: () => Promise<T>, intervalMs = 4000): T | undefined {
  const [data, setData] = useState<T>();
  useEffect(() => {
    let alive = true;
    const run = () => fetcher().then((d) => alive && setData(d)).catch(() => undefined);
    run();
    const id = setInterval(run, intervalMs);
    window.addEventListener("demo-day-advanced", run);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("demo-day-advanced", run);
    };
  }, [fetcher, intervalMs]);
  return data;
}
