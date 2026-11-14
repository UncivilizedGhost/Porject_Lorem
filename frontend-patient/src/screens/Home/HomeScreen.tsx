// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "3 · Home (phase 2)")
// Greeting, one status line, next-step card with one primary action, Nurse Aino card with a
// call button, "Report a symptom". No phase names or day counter. From GET /patients/{id}.
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { NURSE_PHONE } from "../../components/HelpNumbers";
import { formatClock, formatDate } from "../../lib/format";
import { usePatient } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

const STATUS_LINE = {
  on_track: "Your tests are going as planned",
  running_late: "Running late, Nurse Aino knows",
} as const;

export function HomeScreen() {
  const patient = usePatient();
  const navigate = useNavigate();
  const next = patient?.next_step ?? null;
  const pending = next?.pending_confirmation ?? null;
  const when = next ? `${formatDate(next.date)} at ${formatClock(next.time)}` : "";

  const readable = useMemo(
    () => ({
      heading: "Hello",
      body: patient ? `${STATUS_LINE[patient.status]}. ${next ? `Next: ${next.what}, ${when}, ${next.where}.` : ""}` : "",
    }),
    [patient, next, when],
  );
  useReadable(readable);

  const actions = useMemo(
    () => [
      ...(pending
        ? [{
            id: "home:confirm",
            label: "Confirm appointment",
            synonyms: ["confirm"],
            confirm_text: `Confirm the ${next?.what} on ${when}?`,
            run: () => navigate(`/confirm/${pending.id}`),
          }]
        : []),
      { id: "home:report", label: "Report a symptom", run: () => navigate("/report") },
      { id: "home:call", label: "Call Nurse Aino", run: () => { window.location.href = `tel:${NURSE_PHONE}`; } },
    ],
    [pending, next, when, navigate],
  );
  useVoiceActions(actions);

  if (!patient) return <p>Loading…</p>;
  return (
    <section>
      <h1>Hello</h1>
      <p className="status-line">{STATUS_LINE[patient.status]}</p>
      {next && (
        <div className="card next-step">
          <p className="eyebrow">Your next step</p>
          <h2>{next.what}</h2>
          <p><strong>{formatDate(next.date)}</strong> at <strong>{formatClock(next.time)}</strong></p>
          <p>{next.where}</p>
          {pending && <Link className="primary" to={`/confirm/${pending.id}`}>Confirm appointment</Link>}
          <details>
            <summary>How to get there and what to bring</summary>
            <ul>
              <li>Directions: use the HSL journey planner.</li>
              <li>Bring: {next.what_to_bring.join(", ")}.</li>
              <li>Kela taxi reimbursement may cover your trip if you cannot use public transport.</li>
              <li>Your reminders and letters arrive in Suomi.fi Messages.</li>
            </ul>
          </details>
        </div>
      )}
      <div className="card person">
        <h2>Nurse Aino</h2>
        <p>Your named nurse. Weekdays 8–16.</p>
        <a href={`tel:${NURSE_PHONE}`}>Call Nurse Aino</a>
      </div>
      <Link to="/report">Report a symptom</Link>
    </section>
  );
}
