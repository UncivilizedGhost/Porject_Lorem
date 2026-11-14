// Owner: person 3 — .scratch/coordinator-worklist/spec.md (artboard "R7 · Nurse's Worklist card for the report")
// Grade + the rule that set it + rules_version; structured answers in plain words; Own Words
// verbatim on a tinted block labelled spoken / typed; the advice the patient saw; waiting time
// against the 1–2 working-day promise; Call · Assign to me · Record action taken · Mark done.
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

export function SymptomReportCard() {
  const { alertId = "" } = useParams();
  const [version, setVersion] = useState(0);
  const [note, setNote] = useState("");
  const fetcher = useCallback(() => api.alertCard(alertId), [alertId, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const card = usePolling(fetcher, 4000);

  if (!card) return <p>Loading report…</p>;

  const act = async (action: "assign_to_me" | "record_action" | "mark_done") => {
    await api.alertAction(alertId, { action, note: note || undefined });
    if (action === "record_action") setNote("");
    setVersion((v) => v + 1);
  };

  return (
    <article className="r7-card">
      <p>
        <Link to="/worklist">← Worklist</Link>
      </p>
      <h1>
        {card.person.display_name ?? "Patient"} <span className={`wl-level wl-${card.level}`}>{card.level}</span>
      </h1>
      <p className="wl-muted">
        Waiting {card.waiting_working_days} working days (promise: {card.promise_working_days[0]}–
        {card.promise_working_days[1]})
      </p>

      {card.reports.map((r) => (
        <section key={r.event_id} className="r7-report">
          <h2>
            {formatDate(r.created_at)} {formatTime(r.created_at)}
            {r.actor === "trusted_person" && " · reported by a trusted person"}
          </h2>
          <p>
            <strong>{r.grade}</strong>: {r.rule}
          </p>
          <p className="wl-muted">Rules version {r.rules_version}</p>
          {r.safety_check.ticked.length > 0 && <p>Safety Check ticked: {r.safety_check.ticked.join(", ")}</p>}
          {r.symptoms.map((s) => (
            <div key={s.symptom}>
              <h3>
                {s.symptom} ({s.grade})
              </h3>
              <dl>
                {s.answers_plain.map((a) => (
                  <div key={a.question}>
                    <dt>{a.question}</dt>
                    <dd>{a.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          {r.own_words && (
            <blockquote className="r7-own-words">
              <p className="wl-muted">Own words ({r.own_words.source === "voice" ? "spoken" : "typed"}), verbatim</p>
              <p>{r.own_words.text}</p>
            </blockquote>
          )}
          {r.advice_shown && <p>Advice shown: {ADVICE[r.advice_shown]}</p>}
        </section>
      ))}

      {card.actions_taken.length > 0 && (
        <ul>
          {card.actions_taken.map((a, i) => (
            <li key={i}>
              {a.action.replace(/_/g, " ")}
              {a.note ? `: ${a.note}` : ""}
            </li>
          ))}
        </ul>
      )}

      <div className="wl-actions">
        {card.person.phone && (
          <a className="wl-btn" href={`tel:${card.person.phone.replace(/\s/g, "")}`}>
            Call {card.person.phone}
          </a>
        )}
        <button type="button" className="wl-btn" onClick={() => act("assign_to_me")}>
          Assign to me
        </button>
        <label>
          Action taken
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="button" className="wl-btn" onClick={() => act("record_action")}>
          Record action taken
        </button>
        <button type="button" className="wl-btn" onClick={() => act("mark_done")}>
          Mark done
        </button>
      </div>
    </article>
  );
}
