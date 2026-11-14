// Owner: person 1 — .scratch/equity-dashboard/spec.md (artboard "0 · Demo login")
// Demo entry: no credentials. Coordinator → GET /demo/identities → /worklist;
// Equity analyst → /dashboard.
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { setSession } from "../lib/session";

export function LoginScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signInAsCoordinator = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { coordinator_id } = await api.identities();
      setSession({ role: "coordinator", coordinatorId: coordinator_id });
      navigate("/worklist");
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setSubmitting(false);
    }
  };

  const signInAsAnalyst = () => {
    setSession({ role: "county_viewer" });
    navigate("/dashboard");
  };

  return (
    <section className="login card">
      <h1>Cancer Pathway Companion</h1>
      <p>Choose how you'd like to sign in.</p>
      <div className="login-form">
        <button type="button" onClick={signInAsCoordinator} disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in as Coordinator"}
        </button>
        <button type="button" onClick={signInAsAnalyst} disabled={submitting}>
          Sign in as Equity analyst
        </button>
        {error && <p role="alert">{error}</p>}
      </div>
    </section>
  );
}
