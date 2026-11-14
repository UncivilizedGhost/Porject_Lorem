// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "4 · Pathway timeline")
// The 6-week goal line and pathway_steps (done / next / later, future dates marked as
// estimates) from GET /patients/{id}.
import { useMemo } from "react";

import { formatDate } from "../../lib/format";
import { usePatient } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";

const GOAL = "If you need treatment, it starts within 6 weeks of your referral.";
const STATE_LABEL = { done: "Done", next: "Next", later: "Coming" } as const;

export function PathwayScreen() {
  const patient = usePatient();
  const readable = useMemo(() => ({ heading: "Your pathway", body: GOAL }), []);
  useReadable(readable);
  if (!patient) return <p>Loading…</p>;
  return (
    <section>
      <h1>Your pathway</h1>
      <p className="goal">{GOAL}</p>
      <ol className="timeline">
        {patient.pathway_steps.map((s) => (
          <li key={s.id} className={`step step-${s.state}`}>
            <span className="step-state">{STATE_LABEL[s.state]}</span>
            <strong>{s.label}</strong>
            <span>{s.location}</span>
            <span>{s.date_is_estimate ? `About ${formatDate(s.date)}` : formatDate(s.date)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
