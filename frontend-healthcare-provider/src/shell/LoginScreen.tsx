// Owner: person 1 — .scratch/equity-dashboard/spec.md (artboard "0 · Demo login")
// Fake login: accepts any username and password. Coordinator → GET /demo/identities → /worklist;
// County viewer → /dashboard. No real credentials are checked.
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { type Role, setSession } from "../lib/session";

export function LoginScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("coordinator");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Fake authentication: accept any username/password combination.
      if (role === "county_viewer") {
        setSession({ role: "county_viewer" });
        navigate("/dashboard");
        return;
      }
      const { coordinator_id } = await api.identities();
      setSession({ role: "coordinator", coordinatorId: coordinator_id });
      navigate("/worklist");
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="login card">
      <h1>Cancer Pathway Companion</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <label htmlFor="role">Sign in as</label>
        <select id="role" name="role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
          <option value="coordinator">Coordinator</option>
          <option value="county_viewer">County viewer</option>
        </select>
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
