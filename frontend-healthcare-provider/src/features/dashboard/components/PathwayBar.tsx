// Owner: person 1 — .scratch/equity-dashboard/spec.md
// Days per phase (detection, referral, diagnosis, treatment), coloured where the stage warning is exceeded.
// Bar widths are proportional to days; the number is always printed, so colour is never the only cue.
import type { Phase } from "../../../api/types";
import { formatDecimal } from "../../../lib/format";
import { SyntheticBadge } from "./SyntheticBadge";

const PHASES: { key: Phase; label: string }[] = [
  { key: "detection", label: "Detection" },
  { key: "referral", label: "Referral to first visit" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "treatment", label: "Treatment start" },
];

export function PathwayBar({ days, warning }: { days: Record<Phase, number>; warning: Partial<Record<Phase, number>> }) {
  const total = PHASES.reduce((sum, p) => sum + days[p.key], 0);
  return (
    <div role="group" aria-label="Days per phase" className="card">
      <div className="key-number-head">
        <h2>Days per phase</h2>
        <SyntheticBadge />
      </div>
      <div className="pathway-bar">
        {PHASES.map((p) => {
          const limit = warning[p.key];
          const exceeded = limit !== undefined && days[p.key] > limit;
          return (
            <div
              key={p.key}
              data-testid={`phase-${p.key}`}
              data-exceeded={String(exceeded)}
              className="phase"
              style={{ flexGrow: days[p.key] / total }}
            >
              <span className="phase-label">{p.label}</span>
              <strong>{formatDecimal(days[p.key], 0)} days</strong>
              {limit !== undefined && (
                <span className="muted">
                  {exceeded ? "over the " : "within the "}
                  {limit}-day warning
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
