// Owner: person 1 — .scratch/equity-dashboard/spec.md
// One breakdown card, one dimension at a time: segmented control → column chart → table. This keeps
// the comparison encoding (columns) single and avoids five charts and five pies for the same metric.
// Suppressed cells stay "not enough data"; small samples stay flagged. JSONB key order is replaced
// by a stable order per dimension.
import { useState } from "react";

import type { BreakdownCell, CountyDetail } from "../../../api/types";
import { formatPercent } from "../../../lib/format";
import { GroupBars } from "./GroupBars";
import { SyntheticBadge } from "./SyntheticBadge";

const DIMENSIONS: { key: keyof CountyDetail["breakdown"]; title: string }[] = [
  { key: "age", title: "Age" },
  { key: "language", title: "Language" },
  { key: "ethnicity", title: "Ethnicity" },
  { key: "education_group", title: "Education" },
  { key: "municipality_type", title: "Municipality" },
];

const ORDER: Record<string, string[]> = {
  age: ["18-39", "40-49", "50-59", "60-64", "65-74", "75-84", "85+"],
  language: ["Finnish", "Swedish", "Russian", "Estonian", "Ukrainian", "Arabic", "Other"],
  ethnicity: ["Finnish-born", "Foreign-born (EU/EEA)", "Foreign-born (non-EU)", "Not recorded"],
  education_group: ["basic", "upper secondary", "tertiary"],
  municipality_type: ["urban", "semi-urban", "rural"],
};

type Entry = [string, BreakdownCell];

function orderedCells(dimension: string, cells: Record<string, BreakdownCell>): Entry[] {
  const order = ORDER[dimension] ?? [];
  return Object.entries(cells).sort((a, b) => {
    const ia = order.indexOf(a[0]);
    const ib = order.indexOf(b[0]);
    return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
  });
}

export function EquityBreakdown({
  breakdown,
  average,
}: {
  breakdown: CountyDetail["breakdown"];
  average: number;
}) {
  const available = DIMENSIONS.filter(({ key }) => breakdown[key]);
  const [active, setActive] = useState(available[0]?.key ?? "age");
  const cells = breakdown[active];
  if (!cells) return null;

  const entries = orderedCells(active, cells);
  const title = available.find((d) => d.key === active)?.title ?? active;

  return (
    <section role="group" aria-label="Equity breakdown" className="card breakdown">
      <div className="key-number-head breakdown-head">
        <div>
          <h2 className="breakdown-title">Who is left behind?</h2>
          <p className="muted">Share of patients starting treatment within the 6-week target.</p>
        </div>
        <SyntheticBadge />
      </div>

      <div className="dimension-tabs" role="group" aria-label="Breakdown dimension">
        {available.map(({ key, title: label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={key === active}
            onClick={() => setActive(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <GroupBars title={title} entries={entries} average={average} />

      <table className="breakdown-table">
        <caption>{title}: patients and share within target</caption>
        <colgroup>
          <col className="col-group" />
          <col className="col-count" />
          <col className="col-share" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col">Patients</th>
            <th scope="col">Within target</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([label, cell]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {"suppressed" in cell ? (
                <>
                  <td className="muted">–</td>
                  <td className="muted">not enough data</td>
                </>
              ) : (
                <>
                  <td className="num">{cell.n}</td>
                  <td>
                    <span className="breakdown-pct">{formatPercent(cell.pct_within_target)}</span>
                    {cell.small_sample && <span className="warn"><span aria-hidden="true">△ </span>small sample</span>}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
