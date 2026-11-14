// Owner: person 1 — .scratch/equity-dashboard/spec.md
// Visit not confirmed / no transport / waiting for a slot as shares for the stage. Synthetic badge.
// Labels match the wording of the AI summary facts (server: summary_facts.CAUSE_LABEL).
import { formatPercent } from "../../../lib/format";
import { SyntheticBadge } from "./SyntheticBadge";

const LABEL: Record<string, string> = {
  unconfirmed: "Visit not confirmed",
  transport: "No transport to the visit",
  waiting_for_slot: "Waiting for a slot",
};

export function CauseCodes({ shares }: { shares: Record<string, number> }) {
  return (
    <div role="group" aria-label="Cause Codes" className="card">
      <div className="key-number-head">
        <h2>Cause Codes</h2>
        <SyntheticBadge />
      </div>
      <ul className="cause-list">
        {Object.entries(shares).map(([code, share]) => (
          <li key={code}>
            <span>{LABEL[code] ?? code}</span>
            <span className="cause-bar" aria-hidden="true"><span style={{ width: `${share * 100}%` }} /></span>
            <strong>{formatPercent(share * 100)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
