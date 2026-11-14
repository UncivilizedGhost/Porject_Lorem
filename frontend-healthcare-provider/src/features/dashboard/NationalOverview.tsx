// Owner: person 1 — .scratch/equity-dashboard/spec.md (artboard "Equity dashboard · 1 National overview")
// Three KeyNumbers (% within target with Norway 70 % / Sweden 80 % lines, median days, reach rate
// over-75s) above the TileMap + BandLegend; footer evidence caveat [28]; Synthetic badges.
// The national figures are plain averages / medians of the 22 synthetic county rows.
import { useEffect, useState } from "react";

import { api } from "../../api/client";
import type { CountySummary } from "../../api/types";
import { formatPercent } from "../../lib/format";
import { KeyNumber } from "./components/KeyNumber";
import { SyntheticBadge } from "./components/SyntheticBadge";
import { TileMap } from "./components/TileMap";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function NationalOverview() {
  const [counties, setCounties] = useState<CountySummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.counties().then(setCounties).catch(() => setFailed(true));
  }, []);

  if (failed) return <p role="alert">Could not load the county figures.</p>;
  if (!counties) return <p role="status" className="loading">Loading…</p>;

  const pct = mean(counties.map((c) => c.pct_within_target));
  return (
    <div className="dashboard">
      <h1>Lung cancer pathway: are people treated in time?</h1>
      <div className="key-numbers">
        <KeyNumber
          label="Starting treatment within target"
          value={formatPercent(pct)}
          bar={pct}
          benchmarks={[
            { label: "Norway", value: 70 },
            { label: "Sweden", value: 80 },
          ]}
        />
        <KeyNumber
          label="Median days from Referral to treatment"
          value={String(Math.round(median(counties.map((c) => c.median_days_referral_to_treatment))))}
          unit="days"
        />
        <KeyNumber
          label="Reach rate among over 75s"
          value={formatPercent(mean(counties.map((c) => c.reach_rate_over_75)))}
        />
      </div>
      <div role="group" aria-label="County map" className="card">
        <div className="key-number-head">
          <h2>Wellbeing services counties</h2>
          <SyntheticBadge />
        </div>
        <p className="muted">
          Demo tip: click <strong>Western Uusimaa</strong> (the outlined county) to open its pathway view,
          then explore the insight and recommended actions.
        </p>
        <TileMap counties={counties} />
      </div>
      <footer className="caveat muted">
        Evidence linking time-to-treatment and lung cancer survival is mixed [28]; this dashboard targets
        equal access and adherence to the national time limit.
      </footer>
    </div>
  );
}
