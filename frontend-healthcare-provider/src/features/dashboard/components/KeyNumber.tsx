// Owner: person 1 — .scratch/equity-dashboard/spec.md
// One big number with optional benchmark lines (Norway 70 % / Sweden 80 %) and a Synthetic badge.
import { SyntheticBadge } from "./SyntheticBadge";

export interface Benchmark {
  label: string;
  value: number; // 0–100, drawn on the same scale as `bar`
}

export function KeyNumber({
  label,
  value,
  unit,
  bar,
  benchmarks = [],
}: {
  label: string;
  value: string;
  unit?: string;
  bar?: number; // 0–100: draws a bar with the benchmark lines on it
  benchmarks?: Benchmark[];
}) {
  return (
    <div role="group" aria-label={label} className="card key-number">
      <div className="key-number-head">
        <span className="muted">{label}</span>
        <SyntheticBadge />
      </div>
      <p className="key-number-value">
        <span>{value}</span>
        {unit && <span className="unit"> {unit}</span>}
      </p>
      {bar !== undefined && (
        <div className="bench-bar" aria-hidden="true">
          <div className="bench-fill" style={{ width: `${bar}%` }} />
          {benchmarks.map((b) => (
            <div key={b.label} className="bench-line" style={{ left: `${b.value}%` }} />
          ))}
        </div>
      )}
      {benchmarks.length > 0 && (
        <ul className="bench-labels">
          {benchmarks.map((b) => (
            <li key={b.label}>{b.label} {b.value} %</li>
          ))}
        </ul>
      )}
    </div>
  );
}
