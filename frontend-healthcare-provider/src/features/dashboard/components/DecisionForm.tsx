// Owner: person 1 — .scratch/equity-dashboard/spec.md
// Approve / Adapt / Reject, required reason (submit disabled without it), owner, due date.
// The snapshot is built from what is currently rendered: the facts shown, the last simulation
// response and the evidence badges. → POST /dashboard/decisions.
import { useState } from "react";

import { api } from "../../../api/client";
import type { DashboardAction, DecisionInput, SimulationResult, SummaryFact } from "../../../api/types";
import { getSession } from "../../../lib/session";

const VERDICTS: { value: DecisionInput["verdict"]; label: string }[] = [
  { value: "approve", label: "Approve" },
  { value: "adapt", label: "Adapt" },
  { value: "reject", label: "Reject" },
];

function inThirtyDays(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function DecisionForm({
  cardId,
  actions,
  facts,
  simulation,
  onSaved,
}: {
  cardId: string;
  actions: DashboardAction[];
  facts: SummaryFact[];
  simulation: SimulationResult | null;
  onSaved: () => void;
}) {
  const [verdict, setVerdict] = useState<DecisionInput["verdict"]>("approve");
  const [reason, setReason] = useState("");
  const [owner, setOwner] = useState("County coordinator team");
  const [due, setDue] = useState(inThirtyDays);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = reason.trim() !== "" && owner.trim() !== "" && due !== "" && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await api.createDecision({
        card_id: cardId,
        action_ids: actions.map((a) => a._id),
        verdict,
        reason: reason.trim(),
        owner: owner.trim(),
        due,
        decided_by: getSession()?.role ?? "county_viewer",
        snapshot: {
          facts,
          simulation,
          badges: Object.fromEntries(actions.map((a) => [a._id, a.badge])),
        },
      });
      setReason("");
      onSaved();
    } catch {
      setError("The decision could not be saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="decision-form-h" className="card">
      <h2 id="decision-form-h">Record a decision</h2>
      <form onSubmit={submit}>
        <fieldset>
          <legend>Verdict on the matched actions</legend>
          {VERDICTS.map((v) => (
            <label key={v.value}>
              <input type="radio" name="verdict" checked={verdict === v.value} onChange={() => setVerdict(v.value)} /> {v.label}
            </label>
          ))}
        </fieldset>
        <label>
          Reason (required)
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        </label>
        <label>
          Owner
          <input value={owner} onChange={(e) => setOwner(e.target.value)} />
        </label>
        <label>
          Due date
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <button type="submit" disabled={!canSubmit}>Record decision</button>
        {error && <p role="alert">{error}</p>}
      </form>
      <p className="muted">The log is append-only: a recorded decision cannot be edited or removed.</p>
    </section>
  );
}
