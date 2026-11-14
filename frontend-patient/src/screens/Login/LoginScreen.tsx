// Owner: person 2 — design port of app/index.html (artboard "0 · Demo login").
// The brand line, the headline and the role tiles. Patient → GET /demo/identities; Support
// person → the trusted view. The two coordinator roles are shown but disabled, as in the artboard.
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { setSession } from "../../lib/session";

function BrandMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16 8v8l5 3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg width="28" height="28" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LoginScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const enter = async (role: "patient" | "trusted_person") => {
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-frame">
      <main className="login-page">
        <div className="login-head">
          <span className="brand">
            <BrandMark />
            Pathway Companion
          </span>
          <h1 className="login-title">Lung cancer pathway support for Western Uusimaa</h1>
        </div>

        <div className="role-tiles">
          <button type="button" className="role-tile" disabled={busy} onClick={() => enter("patient")}>
            Patient
            <Chevron />
          </button>
          <button type="button" className="role-tile" disabled={busy} onClick={() => enter("trusted_person")}>
            Support person
            <Chevron />
          </button>
          <button type="button" className="role-tile" disabled>
            Coordinator nurse
            <Chevron />
          </button>
          <button type="button" className="role-tile" disabled>
            County decision-maker
            <Chevron />
          </button>
        </div>

        <p className="login-note">Coordinator nurse and county decision-maker are not part of this demo.</p>
        {error && <p role="alert">We could not connect. Please try again.</p>}
      </main>
    </div>
  );
}
