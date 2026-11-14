// Owner: person 1 — .scratch/equity-dashboard/spec.md (artboard "Equity dashboard · 3 Insight Card")
// One card per breakdown group, opened from the county's vulnerability ranking
// (?dimension=…&group=…). Order: what/where/who → CauseCodes → AiSummary → RecommendedActions.
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { api } from "../../api/client";
import type { InsightCardDoc, SummaryResult } from "../../api/types";
import { formatPercent } from "../../lib/format";
import { AiSummary } from "./components/AiSummary";
import { CauseCodes } from "./components/CauseCodes";
import { RecommendedActions } from "./components/RecommendedActions";
import { SyntheticBadge } from "./components/SyntheticBadge";

export function InsightCard() {
  const { name = "" } = useParams();
  const [params] = useSearchParams();
  const dimension = params.get("dimension") ?? "";
  const group = params.get("group") ?? "";

  const [card, setCard] = useState<InsightCardDoc | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ref = { county: name, dimension, group };
    setCard(null);
    setSummary(null);
    setFailed(false);
    api.insight(ref).then(setCard).catch(() => setFailed(true));
    api.summary(ref).then(setSummary).catch(() => setSummary(null));
  }, [name, dimension, group]);

  const back = <Link className="back-link" to={`/dashboard/county/${encodeURIComponent(name)}`}>← {name}</Link>;
  if (failed) return <p role="alert">Could not load this Insight Card. {back}</p>;
  if (!card) return <p role="status" className="loading">Loading…</p>;

  return (
    <div className="dashboard">
      {back}
      <h1>{card.what}</h1>
      <div role="group" aria-label="Gap" className="card card-facts">
        <p>Where: {card.where}</p>
        <p>Who: {card.who}</p>
        <p>
          Within target: <strong>{formatPercent(card.baseline.pct_within_target)}</strong> (n={card.baseline.n}), county{" "}
          {formatPercent(card.county_pct_within_target)}
          {card.baseline.small_sample && <span className="warn"><span aria-hidden="true"> △ </span>small sample</span>}
        </p>
        <SyntheticBadge />
      </div>
      <CauseCodes shares={card.cause_shares} />
      <AiSummary summary={summary} />
      <RecommendedActions actions={card.recommended_actions} />
    </div>
  );
}
