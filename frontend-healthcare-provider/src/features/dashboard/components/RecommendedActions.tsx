// Owner: person 1 — .scratch/equity-dashboard/spec.md
// Recommended Actions side by side: where the recommendation comes from, badge, roadmap action,
// evidence links, and the published effect range or "No effect estimate". The recommendation is a
// rule (Action Library gap pattern ↔ this group), not a model, and the card says so.
import type { Badge, RecommendedAction } from "../../../api/types";
import { formatFractionRange } from "../../../lib/format";

export const BADGE_LABEL: Record<Badge, string> = {
  trial_review: "Trial / review",
  registry_evaluation: "Registry evaluation",
  nordic_policy: "Nordic national policy (not evaluated)",
  single_site: "Single-site project",
};

export function RecommendedActions({ actions }: { actions: RecommendedAction[] }) {
  return (
    <section aria-labelledby="recommended-actions-h" className="card">
      <h2 id="recommended-actions-h">Recommended actions</h2>
      <p className="muted">
        Recommended by matching this group's gap (stage, Cause Code, group) to the Action Library: a
        curated set of actions tied to the national roadmap and cited evidence. No AI model picks them.
      </p>
      {actions.length === 0 ? (
        <p>No action in the Action Library fits this group yet.</p>
      ) : (
        <div className="actions-row">
          {actions.map((a) => (
            <article key={a._id} aria-label={a.title} className="action">
              <h3>{a.title}</h3>
              <p>
                <span className="evidence-badge" data-badge={a.badge}>{BADGE_LABEL[a.badge]}</span>
              </p>
              <p className="action-because">Why this is recommended: {a.recommended_because}</p>
              {a.roadmap_action && <p>Strategy / roadmap: {a.roadmap_action}</p>}
              <ul className="evidence-links">
                {a.evidence.map((e) => (
                  <li key={e.ref}>
                    <a href={e.url} target="_blank" rel="noreferrer">[{e.ref}] {e.label}</a>
                  </li>
                ))}
              </ul>
              {a.effect ? (
                <p>
                  Evidence shows <strong>{formatFractionRange(a.effect.low, a.effect.high)} fewer missed visits</strong>{" "}
                  <span className="muted">
                    ({a.effect.range_rule === "ci" ? "study confidence interval" : "half to full published effect"})
                  </span>
                </p>
              ) : (
                <p className="no-effect">No effect estimate</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
