// Owner: person 1 — "Demo only · day N" + "Advance one day" → POST /demo/advance-day, then
// dispatches window "demo-day-advanced" (usePolling listens). Day from GET /health.
import { useEffect, useState } from "react";

import { api } from "../api/client";

export function DemoBar() {
  const [day, setDay] = useState<number | null>(null);
  useEffect(() => {
    api.health().then((h) => setDay(h.current_demo_day)).catch(() => undefined);
  }, []);
  const advance = async () => {
    const r = await api.advanceDay();
    setDay(r.current_demo_day);
    window.dispatchEvent(new Event("demo-day-advanced"));
  };
  return (
    <div className="demo-bar" role="status">
      <span>Demo only · day {day ?? "–"}</span>
      <button type="button" onClick={advance}>Advance one day</button>
    </div>
  );
}
