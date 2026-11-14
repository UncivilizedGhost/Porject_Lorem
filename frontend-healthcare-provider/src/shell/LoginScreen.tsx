// Owner: person 1 — .scratch/equity-dashboard/spec.md (artboard "0 · Demo login")
// Fake login: accepts any username and password, sets a demo session and opens
// the worklist. No real credentials are checked and no backend call is made.
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { setSession } from "../lib/session";

export function LoginScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Fake authentication: accept any username/password combination.
      await new Promise((resolve) => setTimeout(resolve, 250));
      setSession({ role: "coordinator", coordinatorId: username || "demo-user" });
      navigate("/worklist");
    } catch {
      setError("Could not sign in. Try again.");
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
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
