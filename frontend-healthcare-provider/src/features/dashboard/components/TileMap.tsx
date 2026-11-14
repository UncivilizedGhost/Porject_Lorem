// Owner: person 1 — .scratch/equity-dashboard/spec.md
// One tile per county (22, real names) auto-flowed four per row, coloured by bands.ts,
// Western Uusimaa outlined, click → /dashboard/county/:name. The % is printed on each tile.
import { Link } from "react-router-dom";

import type { CountySummary } from "../../../api/types";
import { formatPercent } from "../../../lib/format";
import { band } from "../bands";
import { BandLegend } from "./BandLegend";

export const DEMO_COUNTY = "Western Uusimaa";

export function TileMap({ counties }: { counties: CountySummary[] }) {
  return (
    <div className="tile-map-wrap">
      <div className="tile-map">
        {counties.map((c) => (
          <Link
            key={c.name}
            to={`/dashboard/county/${encodeURIComponent(c.name)}`}
            className="tile"
            data-band={band(c.pct_within_target)}
            data-demo-county={c.name === DEMO_COUNTY ? "true" : undefined}
          >
            <span className="tile-name">{c.name}</span>
            <span className="tile-pct">{formatPercent(c.pct_within_target)}</span>
          </Link>
        ))}
      </div>
      <BandLegend />
    </div>
  );
}
