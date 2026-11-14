// Owner: person 1 — .scratch/equity-dashboard/spec.md
// Results of POST /dashboard/simulate: days saved and extra people within target as ranges (never a
// point), "needed to reach 70 % / 80 %" beside "evidence shows", and a plain "cannot close the gap".
// The dials themselves live on the Matched Actions; InsightCard debounces the call.
import type { DashboardAction, SimulationResult } from "../../../api/types";
import { formatDecimal, formatFractionRange, formatPercent } from "../../../lib/format";
import { SyntheticBadge } from "./SyntheticBadge";

const range = (low: number, high: number) => `${formatDecimal(low, 0)}–${formatDecimal(high, 0)}`;

export function SimulationPanel({ result, actions }: { result: SimulationResult | null; actions: DashboardAction[] }) {
  if (!result) return <section className="card"><h2>Simulation</h2><p>Calculating…</p></section>;

  const simulated = actions.filter((a) => result.actions[a._id]?.simulated);
  const rule = result.combined.lever_rule_applied;
  const counted = rule?.[0]?.counted ?? simulated[0]?._id;
  const effect = actions.find((a) => a._id === counted)?.effect;
  const gap = result.target_gap;
  const pct = result.combined.pct_within_target;

  return (
    <div role="group" aria-label="Simulation" className="card">
      <div className="key-number-head">
        <h2>Simulation</h2>
        <SyntheticBadge />
      </div>
      <ul className="sim-rows">
        {actions.map((a) => {
          const r = result.actions[a._id];
          if (!r || !r.simulated) return <li key={a._id}>{a.title}: not simulated</li>;
          return (
            <li key={a._id}>
              <strong>{a.title}</strong>
              <div>Days saved: <strong>{`${range(r.days_saved.low, r.days_saved.high)} days`}</strong></div>
              <div>Extra people within target: <strong>{`${range(r.extra_within_target.low, r.extra_within_target.high)} people`}</strong></div>
            </li>
          );
        })}
      </ul>
      {pct && <p>Share within target with the counted effect: <strong>{`${formatDecimal(pct.low, 0)}–${formatDecimal(pct.high, 0)} %`}</strong></p>}
      {rule && (
        <p className="muted">Two actions act on the same lever, so the larger single effect is counted, not the sum.</p>
      )}
      <div role="group" aria-label="Target gap">
        <h3>Target gap</h3>
        {([[70, gap.needed_for_70, gap.reachable_70], [80, gap.needed_for_80, gap.reachable_80]] as const).map(
          ([target, needed, reachable]) => (
            <p key={target}>
              Needed to reach {target} %: {formatPercent(needed * 100)} fewer missed visits.{" "}
              {effect ? <>Evidence shows {formatFractionRange(effect.low, effect.high)} fewer missed visits. </> : null}
              {reachable ? (
                <strong>Within the evidence range.</strong>
              ) : (
                <strong>
                  Cannot close the gap through this lever alone
                  {needed > 1 ? `: even with no missed first visits this group reaches ${formatPercent(gap.max_achievable_pct)}` : ""}.
                </strong>
              )}
            </p>
          ),
        )}
      </div>
    </div>
  );
}
