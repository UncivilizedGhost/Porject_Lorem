// Owner: person 1 — .scratch/equity-dashboard/spec.md
// Unconfirmed / transport / waiting for a slot as shares for the stage. Synthetic badge.
import { formatPercent } from "../../../lib/format";
import { SyntheticBadge } from "./SyntheticBadge";

const LABEL: Record<string, string> = {
  unconfirmed: "Unconfirmed",
  transport: "Transport",
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
