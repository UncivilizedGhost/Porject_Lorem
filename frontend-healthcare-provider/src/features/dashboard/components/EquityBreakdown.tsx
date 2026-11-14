// Owner: person 1 — .scratch/equity-dashboard/spec.md
// Age / language / education group / municipality type. { suppressed } → "not enough data" (no value);
// small_sample → warning. Suppression itself is applied by the server.
import type { CountyDetail } from "../../../api/types";
import { formatPercent } from "../../../lib/format";
import { SyntheticBadge } from "./SyntheticBadge";

const TITLES: Record<keyof CountyDetail["breakdown"], string> = {
  age: "Age group",
  language: "Language",
  education_group: "Education group",
  municipality_type: "Municipality type",
};

export function EquityBreakdown({ breakdown }: { breakdown: CountyDetail["breakdown"] }) {
  return (
    <div role="group" aria-label="Equity breakdown" className="card">
      <div className="key-number-head">
        <h2>Who is left behind? Share within target</h2>
        <SyntheticBadge />
      </div>
      <div className="breakdown-grid">
        {(Object.keys(TITLES) as (keyof typeof TITLES)[]).map((dimension) => (
          <table key={dimension}>
            <caption>{TITLES[dimension]}</caption>
            <tbody>
              {Object.entries(breakdown[dimension] ?? {}).map(([label, cell]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {"suppressed" in cell ? (
                    <td className="muted">not enough data</td>
                  ) : (
                    <td>
                      {formatPercent(cell.pct_within_target)}
                      {cell.small_sample && <span className="warn"> small sample, treat with caution</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}
