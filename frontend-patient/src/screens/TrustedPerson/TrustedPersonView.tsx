// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "6 · Trusted-person view")
// GET /patients/{id}/trusted-view: appointments + pending Confirmations only, never clinical
// content or past answers. Can confirm, check in and report a symptom with actor
// "trusted_person" (the shared flows read it from the session).
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { formatClock, formatDate, formatTime } from "../../lib/format";
import { useTrustedView } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";

export function TrustedPersonView() {
  const view = useTrustedView();
  const readable = useMemo(
    () => ({ heading: "Helping the patient", body: "Appointments and confirmations you can help with." }),
    [],
  );
  useReadable(readable);
  if (!view) return <p>Loading…</p>;

  const next = view.next_step;
  const rows = view.appointments.length
    ? view.appointments.map((a) => ({
        key: a._id,
        what: a.what,
        date: formatDate(a.at),
        time: formatTime(a.at),
        where: a.where,
      }))
    : next
      ? [{ key: next.id, what: next.what, date: formatDate(next.date), time: formatClock(next.time), where: next.where }]
      : [];
  const pending = next?.pending_confirmation ?? null;

  return (
    <section>
      <h1>Helping the patient</h1>
      <p>You see appointments and confirmations only. What you do is shown to the nurse with your name.</p>
      <h2>Appointments</h2>
      <ul>
        {rows.map((r) => (
          <li key={r.key}>
            <strong>{r.what}</strong> {r.date} at {r.time}, {r.where}
          </li>
        ))}
      </ul>
      {pending && <Link className="primary" to={`/confirm/${pending.id}`}>Confirm appointment for them</Link>}
      <Link to="/check-in">Check in for them</Link>
      <Link to="/report">Report a symptom for them</Link>
    </section>
  );
}
