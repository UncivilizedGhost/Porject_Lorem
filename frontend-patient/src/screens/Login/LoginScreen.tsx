// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "0 · Demo login")
// Neutral "strong identification (mocked)" placeholder, no Suomi.fi/Omapolku branding.
// Patient → GET /demo/identities (no Contact → /risk-check; promoted → /home), Trusted Person
// → /trusted. Role + id go into lib/session.ts.
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { setSession } from "../../lib/session";

export function LoginScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  const enter = async (role: "patient" | "trusted_person") => {
    try {
      const ids = await api.identities();
      setError(false);
      if (role === "trusted_person") {
        setSession({
          role,
          patientId: ids.patient_id ?? undefined,
          contactId: ids.contact_id ?? undefined,
          trustedPersonName: ids.trusted_person?.name ?? "Liisa Virtanen",
        });
        navigate("/trusted");
        return;
      }
      setSession({ role, patientId: ids.patient_id ?? undefined, contactId: ids.contact_id ?? undefined });
      if (ids.patient_id) navigate("/home");
      else if (ids.contact_id) navigate("/warning-signs");
      else navigate("/risk-check");
    } catch {
      setError(true);
    }
  };

  return (
    <main className="login">
      <h1>Sign in</h1>
      <p>Strong identification (mocked). This is a demo: no real identification is used.</p>
      <button type="button" className="primary" onClick={() => enter("patient")}>I am the patient</button>
      <button type="button" onClick={() => enter("trusted_person")}>I am someone you trust</button>
      {error && <p role="alert">We could not connect. Please try again.</p>}
    </main>
  );
}
