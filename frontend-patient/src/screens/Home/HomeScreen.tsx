// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "3 · Home (phase 2)")
// Ported from app/home.html: greeting, one status line, the next step with its single primary
// action, "Report a symptom" and "Call Nurse Aino" tiles, the weekly check-in row.
// No phase names and no day counter. From GET /patients/{id}.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { NURSE_PHONE } from "../../components/HelpNumbers";
import { NoPathwayYet } from "../../components/NoPathwayYet";
import { formatClock, formatDate, formatWeekday } from "../../lib/format";
import { usePatient } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

const STATUS_LINE = {
  on_track: "Your tests are going as planned",
  running_late: "Running late, Nurse Aino knows",
} as const;

/** "Good morning" before noon, then afternoon, then evening. */
function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M7 4l6 6-6 6"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <path
        d="M6 6h18v18H6zM15 11v8M11 15h8"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <path
        d="M7 4h4l2 5-3 2a13 13 0 006 6l2-3 5 2v4a2 2 0 01-2 2A19 19 0 015 6a2 2 0 012-2z"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomeScreen() {
  const patient = usePatient();
  const navigate = useNavigate();
  const next = patient?.next_step ?? null;
  const pending = next?.pending_confirmation ?? null;
  const name = patient?.display_name ?? null;
  const when = next ? `${formatWeekday(next.date)} ${formatDate(next.date)} at ${formatClock(next.time)}` : "";

  // How many check-in questions there are; the artboard shows "4 of 10 answered", but answers
  // are not stored server-side, so only the total and the time are real.
  const [checkinTotal, setCheckinTotal] = useState<number>();
  useEffect(() => {
    let live = true;
    api.rules()
      .then((r) => { if (live) setCheckinTotal(r.checkin_items.length); })
      .catch(() => undefined);
    return () => { live = false; };
  }, []);

  const hello = `${greeting()}${name ? `, ${name}` : ""}`;
  const readable = useMemo(
    () => ({
      heading: hello,
      body: patient
        ? `${STATUS_LINE[patient.status]}.${next ? ` Next: ${next.what}, ${when}, ${next.where}.` : ""}`
        : "",
    }),
    [hello, patient, next, when],
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
      { id: "home:checkin", label: "Weekly check-in", run: () => navigate("/check-in") },
    ],
    [pending, next, when, navigate],
  );
  useVoiceActions(actions);

  if (patient === null) return <NoPathwayYet />;
  if (!patient) return <p>Loading…</p>;

  return (
    <section className="home">
      <div className="home-heading">
        <h1 className="home-greeting">{hello}</h1>
        <p className="status-line">
          <span
            className={`status-dot ${patient.status === "on_track" ? "status-ok" : ""}`}
            aria-hidden="true"
          />
          {STATUS_LINE[patient.status]}
        </p>
      </div>

      {next && (
        <div className="card next-step">
          <div className="next-facts">
            <p className="eyebrow">Your next step</p>
            <h2 className="next-title">{next.what}</h2>
            <p className="next-when">{when}</p>
            <p className="next-where">{next.where}</p>
          </div>
          <Link className="text-link" to="/pathway">
            How to get there and what to bring
            <ChevronIcon />
          </Link>
          {pending && (
            <div className="confirm-block">
              <span className="chip chip-wait">Not confirmed yet</span>
              <Link className="primary" to={`/confirm/${pending.id}`}>Confirm appointment</Link>
            </div>
          )}
        </div>
      )}

      <div className="tile-grid">
        <Link className="tile" to="/report">
          <ReportIcon />
          <span className="tile-text">
            <span className="tile-title">Report a symptom</span>
            <span className="tile-sub">Tell Nurse Aino</span>
          </span>
        </Link>
        <a className="tile tile-apricot" href={`tel:${NURSE_PHONE}`}>
          <PhoneIcon />
          <span className="tile-text">
            <span className="tile-title">Call Nurse Aino</span>
            <span className="tile-sub">Weekdays 8–16</span>
          </span>
        </a>
      </div>

      <Link className="row-link" to="/check-in">
        <span>
          <span className="row-link-title">Weekly check-in</span>
          <span className="row-link-sub">
            {checkinTotal ? `${checkinTotal} questions · 3 min` : "A few questions · 3 min"}
          </span>
        </span>
        <ChevronIcon />
      </Link>
    </section>
  );
}
