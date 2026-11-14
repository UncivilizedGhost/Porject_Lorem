// Owner: person 2 — design port of app/timeline.html (artboard "4 · Pathway timeline").
// The 6-week goal line and pathway_steps (done / next / later) from GET /patients/{id}, drawn as
// the artboard's marker rail: teal checks for done, a thick ring for next, a thin grey ring for
// later, and the next step's card in pale teal.
import { useMemo } from "react";

import { NoPathwayYet } from "../../components/NoPathwayYet";
import { formatDate, formatWeekday } from "../../lib/format";
import { usePatient } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";

const GOAL = "If you need treatment, it starts within 6 weeks of your referral.";

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PathwayScreen() {
  const patient = usePatient();
  const readable = useMemo(() => ({ heading: "Your pathway", body: GOAL }), []);
  useReadable(readable);
  if (patient === null) return <NoPathwayYet />;
  if (!patient) return <p>Loading…</p>;

  const steps = patient.pathway_steps;
  const done = steps.filter((s) => s.state === "done").length;
  const next = steps.find((s) => s.state === "next");
  const percent = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const week = next ? Math.max(1, Math.ceil(next.expected_day / 7)) : 1;

  return (
    <section className="pathway">
      <h1>Your pathway</h1>

      <div className="goal-card">
        <span className="goal-bar" aria-hidden="true">
          <span className="goal-fill" style={{ width: `${percent}%` }} />
        </span>
        <div className="goal-row">
          <span>Week {week}</span>
          <span>{next ? `By ${formatDate(next.date)}` : "All steps done"}</span>
        </div>
      </div>

      <ol className="path">
        {steps.map((s) => (
          <li key={s.id} className={`path-item ${s.state}`}>
            <span className="path-rail" aria-hidden="true">
              <span className="path-marker">{s.state === "done" ? <CheckIcon /> : null}</span>
              <span className="path-line" />
            </span>
            <div className="path-body">
              <div className="path-card">
                {s.state === "next" && <span className="chip-next">Next</span>}
                <span className="path-title">{s.label}</span>
                <span className="path-meta">
                  {s.date_is_estimate ? `Usually ${formatDate(s.date)}` : `${formatWeekday(s.date)} ${formatDate(s.date)}`}
                </span>
                {s.location && <span className="path-meta">{s.location}</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="screen-sub">{GOAL}</p>
    </section>
  );
}
