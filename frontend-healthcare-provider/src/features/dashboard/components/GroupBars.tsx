import type { BreakdownCell } from "../../../api/types";
import { formatPercent } from "../../../lib/format";
import { band } from "../bands";

const W = 480;
const PAD = { left: 40, right: 12, top: 24 };
const INNER_H = 158;
const TICK_FONT = 10;
const CHAR_W = 5.4; // average glyph width at 10px system-ui
const ANGLE = 40;

// Vertical room a rotated label needs below the baseline.
function bottomPad(labels: string[]): number {
  const longest = Math.max(...labels.map((l) => l.length));
  const rise = longest * CHAR_W * Math.sin((ANGLE * Math.PI) / 180);
  return Math.max(58, Math.ceil(rise) + 14 + TICK_FONT);
}

type Cell = { pct_within_target: number; n: number; small_sample: boolean };

export function GroupBars({
  title,
  entries,
  average,
}: {
  title: string;
  entries: [string, BreakdownCell][];
  average: number;
}) {
  const rows = entries.filter(([, cell]) => !("suppressed" in cell)) as [string, Cell][];
  if (rows.length === 0) return null;

  const bottom = bottomPad(rows.map(([l]) => l));
  const H = PAD.top + INNER_H + bottom;
  const innerW = W - PAD.left - PAD.right;
  const slot = innerW / rows.length;
  const barW = Math.min(46, slot * 0.6);
  const y = (pct: number) => PAD.top + (1 - pct / 100) * INNER_H;
  const baseline = PAD.top + INNER_H;
  const cx = (i: number) => PAD.left + slot * i + slot / 2;

  return (
    <div className="group-chart">
      <svg
        className="group-bars"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Column chart of ${title.toLowerCase()}: ${rows
          .map(([label, cell]) => `${label} ${formatPercent(cell.pct_within_target)} within target (n=${cell.n})`)
          .join("; ")}. County-wide ${formatPercent(average)}.`}
      >
        <g className="chart-grid">
          {[0, 25, 50, 75, 100].map((tick) => (
            <line key={tick} x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} />
          ))}
        </g>
        <g className="chart-axis">
          {[0, 25, 50, 75, 100].map((tick) => (
            <text key={tick} x={PAD.left - 8} y={y(tick) + 3} textAnchor="end">
              {tick}
            </text>
          ))}
          <text x={6} y={PAD.top - 6} className="chart-axis-label">%</text>
        </g>

        {/* 1. bars */}
        {rows.map(([label, cell], i) => (
          <rect
            key={label}
            className="group-bar"
            data-band={band(cell.pct_within_target)}
            x={cx(i) - barW / 2}
            y={y(cell.pct_within_target)}
            width={barW}
            height={baseline - y(cell.pct_within_target)}
            rx={3}
          >
            <title>{`${label}: ${formatPercent(cell.pct_within_target)} within target (n=${cell.n})`}</title>
          </rect>
        ))}

        {/* 2. county line, above bars, below labels */}
        <line className="chart-average" x1={PAD.left} x2={W - PAD.right} y1={y(average)} y2={y(average)} />

        {/* 3. value labels with halo so the line never strikes through them */}
        {rows.map(([label, cell], i) => (
          <text
            key={label}
            className="group-bar-value"
            x={cx(i)}
            y={y(cell.pct_within_target) - 5}
            textAnchor="middle"
          >
            {formatPercent(cell.pct_within_target)}
          </text>
        ))}

        {/* 4. category labels */}
        {rows.map(([label], i) => (
          <text
            key={label}
            className="chart-tick"
            transform={`translate(${cx(i)},${baseline + 14}) rotate(-${ANGLE})`}
            textAnchor="end"
          >
            {label}
          </text>
        ))}
      </svg>
      <p className="chart-key">
        <span className="chart-key-line" aria-hidden="true" />
        County-wide {formatPercent(average)}
      </p>
    </div>
  );
}