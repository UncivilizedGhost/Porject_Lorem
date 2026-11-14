// Owner: person 1 — .scratch/equity-dashboard/spec.md (artboard "0 · Demo login")
// Neutral "strong identification (mocked)" placeholder. Coordinator → GET /demo/identities → /worklist;
// County viewer → /dashboard. Role kept in lib/session.ts. No real eID.
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { setSession } from "../lib/session";

export function LoginScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const asCoordinator = async () => {
    setError(null);
    try {
      const { coordinator_id } = await api.identities();
      setSession({ role: "coordinator", coordinatorId: coordinator_id });
      navigate("/worklist");
    } catch {
      setError("Could not reach the server. Is it running?");
    }
  };

  const asCountyViewer = () => {
    setSession({ role: "county_viewer" });
    navigate("/dashboard");
  };

  return (
    <section className="login card">
      <h1>Cancer Pathway Companion</h1>
      <p className="muted">Strong identification (mocked). Demo only: no real sign-in takes place.</p>
      <div className="login-buttons">
        <button type="button" onClick={asCoordinator}>Coordinator</button>
        <button type="button" onClick={asCountyViewer}>County viewer</button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
