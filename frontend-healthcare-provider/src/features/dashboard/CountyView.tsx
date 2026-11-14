// Owner: person 1 — .scratch/equity-dashboard/spec.md (artboard "Equity dashboard · 2 Pathway view (Western Uusimaa)")
// PathwayBar (days per phase, coloured where exceeded), EquityBreakdown (suppressed / small-sample cells),
// share outside the fast-track, link to the Insight Card, back to overview. GET /dashboard/counties/{name}.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../api/client";
import type { CountyDetail } from "../../api/types";
import { formatPercent } from "../../lib/format";
import { EquityBreakdown } from "./components/EquityBreakdown";
import { PathwayBar } from "./components/PathwayBar";
import { SyntheticBadge } from "./components/SyntheticBadge";

export function CountyView() {
  const { name = "" } = useParams();
  const [county, setCounty] = useState<CountyDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCounty(null);
    api.county(name).then(setCounty).catch(() => setFailed(true));
  }, [name]);

  const back = <Link to="/dashboard">← National overview</Link>;
  if (failed) return <p role="alert">Could not load {name}. {back}</p>;
  if (!county) return <p>Loading…</p>;

  const cardSlug = county.insight_card_id?.split("/")[1];
  return (
    <div className="dashboard">
      {back}
      <h1>{county.name}</h1>
      <PathwayBar days={county.days_per_phase} warning={county.stage_warning_days} />
      <div role="group" aria-label="Lung cancers diagnosed outside the fast-track" className="card key-number">
        <div className="key-number-head">
          <span className="muted">Lung cancers diagnosed outside the fast-track (no suspected-cancer Referral)</span>
          <SyntheticBadge />
        </div>
        <p className="key-number-value">{formatPercent(county.pct_outside_fast_track)}</p>
        <p className="muted">These pathways never had a clock running.</p>
      </div>
      <EquityBreakdown breakdown={county.breakdown} />
      {cardSlug && (
        <p>
          <Link className="button-link" to={`/dashboard/county/${encodeURIComponent(county.name)}/insight/${cardSlug}`}>
            Open the Insight Card: missed first visits among over-75s
          </Link>
        </p>
      )}
    </div>
  );
}
