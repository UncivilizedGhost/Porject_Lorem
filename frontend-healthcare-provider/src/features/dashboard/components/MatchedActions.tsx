// Owner: person 1 — .scratch/equity-dashboard/spec.md
// Matched Actions side by side: badge, roadmap action, evidence links, and one dial bounded to the
// evidence range ("assumed effect in Finland", published value marked) or "No effect estimate: not
// simulated". The system matches; a person decides: the word "Recommended" is never used.
import type { Badge, DashboardAction } from "../../../api/types";
import { formatPercent } from "../../../lib/format";

export const BADGE_LABEL: Record<Badge, string> = {
  trial_review: "Trial / review",
  registry_evaluation: "Registry evaluation",
  nordic_policy: "Nordic national policy (not evaluated)",
  single_site: "Single-site project",
};

export function MatchedActions({
  actions,
  dials,
  onDial,
}: {
  actions: DashboardAction[];
  dials: Record<string, number>;
  onDial: (actionId: string, value: number) => void;
}) {
  return (
    <section aria-labelledby="matched-actions-h" className="card">
      <h2 id="matched-actions-h">Matched actions</h2>
      <p className="muted">Matched to this gap pattern from the Action Library. A person decides.</p>
      <div className="actions-row">
        {actions.map((a) => (
          <article key={a._id} aria-label={a.title} className="action">
            <h3>{a.title}</h3>
            <p>
              <span className="evidence-badge" data-badge={a.badge}>{BADGE_LABEL[a.badge]}</span>
            </p>
            {a.roadmap_action && <p>Roadmap: {a.roadmap_action}</p>}
            <ul className="evidence-links">
              {a.evidence.map((e) => (
                <li key={e.ref}>
                  <a href={e.url} target="_blank" rel="noreferrer">[{e.ref}] {e.label}</a>
                </li>
              ))}
            </ul>
            {a.effect ? <Dial action={a} value={dials[a._id] ?? a.effect.published} onDial={onDial} /> : (
              <p className="no-effect">No effect estimate: not simulated</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Dial({
  action,
  value,
  onDial,
}: {
  action: DashboardAction;
  value: number;
  onDial: (actionId: string, value: number) => void;
}) {
  const effect = action.effect!;
  const listId = `published-${action._id}`;
  return (
    <div className="dial">
      <label>
        Assumed effect in Finland: <strong>{formatPercent(value * 100, value * 100 % 1 ? 1 : 0)} fewer missed visits</strong>
        <input
          type="range"
          aria-label={`Assumed effect in Finland: ${action.title}`}
          min={effect.low}
          max={effect.high}
          step={0.005}
          value={value}
          list={listId}
          onChange={(e) => onDial(action._id, parseFloat(e.target.value))}
        />
      </label>
      <datalist id={listId}>
        <option value={effect.published} />
      </datalist>
      <p className="muted">
        Published value: {formatPercent(effect.published * 100)} ({effect.range_rule === "ci" ? "study confidence interval" : "half to full published effect"})
      </p>
    </div>
  );
}
