// Owner: person 3 — .scratch/coordinator-worklist/spec.md (artboard "R7 · Nurse's Worklist card for the report")
// Full-width report: each report is one card with its rule, the Patient's answers per symptom,
// Own Words verbatim on a tinted block, the advice shown and the safety check. The sidebar keeps
// the actions (Call · Assign · Record with an action-type field · Mark done) and the history.
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../api/client";
import { formatDate, formatTime } from "../../lib/format";
import { usePolling } from "../../lib/usePolling";
import "./worklist.css";

const ADVICE = {
  call_now: "Told to call 116 117 or go to the emergency department now",
  nurse_review: "Told a nurse will review the report within 1–2 working days",
  self_care: "Shown self-care advice",
} as const;

const ACTION_OPTIONS = [
  "Called patient",
  "Booked appointment",
  "Sent a message",
  "Left a voicemail",
  "No answer",
  "Other",
];

export function SymptomReportCard() {
  const { alertId = "" } = useParams();
  const [version, setVersion] = useState(0);
  const [note, setNote] = useState("");
  const [actionKind, setActionKind] = useState("");
  const fetcher = useCallback(() => api.alertCard(alertId), [alertId, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const card = usePolling(fetcher, 4000);

  if (!card) return <p>Loading report…</p>;

  const act = async (action: "assign_to_me" | "record_action" | "mark_done") => {
    const text =
      action === "record_action" ? [actionKind, note.trim()].filter(Boolean).join(" — ") : "";
    await api.alertAction(alertId, { action, note: text || undefined });
    if (action === "record_action") {
      setNote("");
      setActionKind("");
    }
    setVersion((v) => v + 1);
  };

  return (
    <article className="r7-page">
      <header className="r7-header">
        <div className="r7-header-text">
          <Link className="r7-back" to="/worklist">
            ← Worklist
          </Link>
          <h1>
            {card.person.display_name ?? "Patient"}
            <span className={`wl-level wl-${card.level}`}>{card.level}</span>
          </h1>
          <p className="r7-meta">
            {card.reports.length} {card.reports.length === 1 ? "report" : "reports"} · waiting{" "}
            {card.waiting_working_days} working days (promise: {card.promise_working_days[0]}–
            {card.promise_working_days[1]})
          </p>
        </div>
        <div className="r7-waiting" aria-hidden="true">
          <strong>{card.waiting_working_days}</strong>
          <span>working days waiting</span>
        </div>
      </header>

      <div className="r7-grid">
        <div className="r7-main">
          {card.reports.map((r) => (
            <section key={r.event_id} className="r7-report">
              <div className="r7-report-head">
                <div>
                  <h2>
                    Report · {formatDate(r.created_at)} {formatTime(r.created_at)}
                  </h2>
                  <div className="r7-fields">
                    <span className="r7-field-item">
                      <span className="r7-field-label">Submitted via</span>
                      <span>{r.input === "voice" ? "Voice" : "Typed"}</span>
                    </span>
                    <span className="r7-field-item">
                      <span className="r7-field-label">Reported by</span>
                      <span>{r.actor === "trusted_person" ? "Trusted person" : "Patient"}</span>
                    </span>
                    <span className="r7-field-item">
                      <span className="r7-field-label">Safety check</span>
                      <span>{r.safety_check.ticked.length > 0 ? "Ticked" : "None ticked"}</span>
                    </span>
                  </div>
                </div>
                <span className={`wl-level wl-${r.grade}`}>{r.grade}</span>
              </div>

              <div className="r7-rule">
                <span className="r7-field-label">Rule that set the grade</span>
                <p>{r.rule}</p>
                <p className="wl-muted">Rules version {r.rules_version}</p>
              </div>

              {r.safety_check.ticked.length > 0 && (
                <div className="r7-block">
                  <h3 className="r7-section-title">Safety check ticked</h3>
                  <ul className="r7-chip-list">
                    {r.safety_check.ticked.map((t) => (
                      <li key={t} className="r7-chip">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="r7-block">
                <h3 className="r7-section-title">What the patient answered</h3>
                {r.symptoms.map((s) => (
                  <div key={s.symptom} className="r7-symptom">
                    <div className="r7-symptom-head">
                      <h4>{s.symptom}</h4>
                      <span className={`wl-level wl-${s.grade}`}>{s.grade}</span>
                    </div>
                    <dl className="r7-answers">
                      {s.answers_plain.map((a) => (
                        <div key={a.question} className="r7-answer">
                          <dt>{a.question}</dt>
                          <dd>{a.answer}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>

              {r.own_words && (
                <blockquote className="r7-own-words">
                  <p className="wl-muted">
                    Own words ({r.own_words.source === "voice" ? "spoken" : "typed"}), verbatim
                  </p>
                  <p className="r7-own-text">{r.own_words.text}</p>
                </blockquote>
              )}

              {r.advice_shown && (
                <div className="r7-advice">
                  <span className="r7-field-label">Advice shown to the patient</span>
                  <p>{ADVICE[r.advice_shown]}</p>
                </div>
              )}
            </section>
          ))}
        </div>

        <aside className="r7-side" aria-label="Report actions and history">
          <section className="r7-panel">
            <h2>Actions</h2>
            {card.person.phone && (
              <a className="wl-btn" href={`tel:${card.person.phone.replace(/\s/g, "")}`}>
                Call {card.person.phone}
              </a>
            )}
            <button type="button" className="wl-btn" onClick={() => act("assign_to_me")}>
              Assign to me
            </button>
            <button type="button" className="wl-btn" onClick={() => act("mark_done")}>
              Mark done
            </button>
          </section>

          <section className="r7-panel">
            <h2>Record action taken</h2>
            <label className="r7-field">
              Action type
              <select value={actionKind} onChange={(e) => setActionKind(e.target.value)}>
                <option value="">Choose an option</option>
                {ACTION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="r7-field">
              Note
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What was agreed?"
              />
            </label>
            <button type="button" className="wl-btn" onClick={() => act("record_action")}>
              Record action taken
            </button>
          </section>

          <section className="r7-panel">
            <h2>History</h2>
            {card.actions_taken.length === 0 ? (
              <p className="wl-muted">No actions recorded yet.</p>
            ) : (
              <ul className="r7-history">
                {card.actions_taken.map((a, i) => (
                  <li key={i}>
                    <strong>{a.action.replace(/_/g, " ")}</strong>
                    {a.note && <span>{a.note}</span>}
                    <span className="wl-muted">
                      {formatDate(a.at)} {formatTime(a.at)} · {a.by}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </article>
  );
}
