# Handoff: Western Uusimaa county page (provider app)

Everything one agent needs to understand, run and modify the **level-2 county pathway page**.

- Route: `/dashboard/county/:name` — demo county URL: `/dashboard/county/Western%20Uusimaa`
- App: `frontend-healthcare-provider` (React 18 + Vite + TypeScript + react-router-dom)
- API: FastAPI under `server/`, proxied at `/api` by Vite
- Charts: hand-written inline SVG, **no chart library**
- Owner comment in the source: person 1, spec `.scratch/equity-dashboard/spec.md`

---

## 1. What the page shows, in order

1. Back link to `/dashboard`.
2. `h1` county name.
3. `PathwayBar` — days per phase, red where the stage warning is exceeded.
4. One key number — lung cancers diagnosed outside the fast-track.
5. `EquityBreakdown` — one card:
   - pill selector: Age / Language / Ethnicity / Education / Municipality
   - one column chart (`GroupBars`) with a county-wide reference line
   - one full-width table with n, % within target, suppression and small-sample flags
6. `VulnerabilityPanel` — top 5 groups by score, then an on-demand AI/Action-Library options panel.
7. Link to the Insight Card when `insight_card_id` exists.

County page uses `county.pct_within_target` (53.6 for Western Uusimaa) as the **county-wide** benchmark.
It is deliberately the same number on every dimension: it is the whole county, not the mean of the
visible bars. The n-weighted mean of each dimension lands within rounding of it (53.16–53.65).

---

## 2. Run it

```bash
# API (port 8000)
cd server
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir .

# frontend (port 5174, proxies /api -> localhost:8000)
cd frontend-healthcare-provider
npm run dev

# after editing server/app/fixtures/counties.json
cd server
.venv/bin/python -m app.fixtures.seed
```

Checks used in this repo (the existing Vitest suite is considered outdated by the project owner):

```bash
cd frontend-healthcare-provider
npx tsc -b
npx vite build
```

No browser was available during the work, so layout was never visually verified.

---

## 3. Data contract

`GET /dashboard/counties/{name}` returns the full county document. The server:

- converts every breakdown cell with `n < 5` to `{ "suppressed": true }` (no value at all);
- adds `small_sample: true` to cells with `n < 20`;
- injects `stage_warning_days` from the single insight-card fixture.

One breakdown cell is either:

```ts
{ suppressed: true }
{ pct_within_target: number; n: number; small_sample: boolean }
```

`ethnicity` only exists for Western Uusimaa in the fixture; all components handle missing dimensions.

`POST /dashboard/suggest` body:

```json
{ "county": "Western Uusimaa", "dimension": "age", "group": "85+" }
```

Response:

```ts
{
  sentences: { text: string; fact_ids: string[] }[];
  facts: { id: string; text: string; value: number | string; source_url?: string }[];
  source: "ai" | "rules";
}
```

`source` is `"rules"` whenever Nemotron is unconfigured or fails, which is the current state
(`NEMOTRON_BASE_URL`, model and key are all unset in this environment). The UI discloses which source
was used. The suggestion prompt forbids recommending/ranking; text is "options to explore".

---

## 4. Files and full code

### 4.1 `src/App.tsx` (route)

```tsx
import { Route, Routes } from "react-router-dom";

import { CountyView } from "./features/dashboard/CountyView";
import { InsightCard } from "./features/dashboard/InsightCard";
import { NationalOverview } from "./features/dashboard/NationalOverview";
import { SimLogScreen } from "./features/simlog/SimLogScreen";
import { BookingScreen } from "./features/worklist/Booking/BookingScreen";
import { SymptomReportCard } from "./features/worklist/SymptomReportCard";
import { WorklistScreen } from "./features/worklist/WorklistScreen";
import { AppShell } from "./shell/AppShell";
import { LoginScreen } from "./shell/LoginScreen";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<LoginScreen />} />
        {/* person 3 */}
        <Route path="/worklist" element={<WorklistScreen />} />
        <Route path="/worklist/alerts/:alertId" element={<SymptomReportCard />} />
        <Route path="/worklist/book/:rowId" element={<BookingScreen />} />
        {/* person 1 */}
        <Route path="/dashboard" element={<NationalOverview />} />
        <Route path="/dashboard/county/:name" element={<CountyView />} />
        <Route path="/dashboard/county/:name/insight/:cardSlug" element={<InsightCard />} />
        {/* person 4 */}
        <Route path="/sim-log" element={<SimLogScreen />} />
      </Route>
    </Routes>
  );
}
```

### 4.2 `src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import "./styles/tokens.css";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

### 4.3 `src/features/dashboard/CountyView.tsx`

```tsx
// Owner: person 1 — .scratch/equity-dashboard/spec.md (artboard "Equity dashboard · 2 Pathway view (Western Uusimaa)")
// PathwayBar (days per phase, coloured where exceeded), EquityBreakdown (one dimension at a time:
// column chart + table), VulnerabilityPanel (compact ranking + AI options), share outside the
// fast-track, link to the Insight Card, back to overview. GET /dashboard/counties/{name}.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../api/client";
import type { CountyDetail } from "../../api/types";
import { formatPercent } from "../../lib/format";
import { EquityBreakdown } from "./components/EquityBreakdown";
import { PathwayBar } from "./components/PathwayBar";
import { VulnerabilityPanel } from "./components/VulnerabilityPanel";
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
      <EquityBreakdown breakdown={county.breakdown} average={county.pct_within_target} />
      <VulnerabilityPanel county={county.name} breakdown={county.breakdown} />
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
```

### 4.4 `src/features/dashboard/components/EquityBreakdown.tsx`

```tsx
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
                    {cell.small_sample && <span className="warn"> small sample</span>}
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
```

### 4.5 `src/features/dashboard/components/GroupBars.tsx`

```tsx
// Owner: person 1 — county view addition. Column chart for one breakdown dimension: share within
// target per group on a shared 0–100 axis, bars coloured by the existing bands (lightness-distinct).
// The county-wide key sits outside the plot so it can never overlap a bar value or label. It is the
// same line for every dimension on purpose: it is the whole county, not the mean of visible bars.
import type { BreakdownCell } from "../../../api/types";
import { formatPercent } from "../../../lib/format";
import { band } from "../bands";

const W = 480;
const H = 240;
const PAD = { left: 40, right: 12, top: 24, bottom: 58 };

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

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / rows.length;
  const barW = Math.min(46, slot * 0.6);
  const y = (pct: number) => PAD.top + (1 - pct / 100) * innerH;
  const baseline = PAD.top + innerH;

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
          <text x={6} y={PAD.top - 6} className="chart-axis-label">
            %
          </text>
        </g>

        {rows.map(([label, cell], i) => {
          const cx = PAD.left + slot * i + slot / 2;
          return (
            <g key={label}>
              <rect
                className="group-bar"
                data-band={band(cell.pct_within_target)}
                x={cx - barW / 2}
                y={y(cell.pct_within_target)}
                width={barW}
                height={baseline - y(cell.pct_within_target)}
                rx={3}
              >
                <title>{`${label}: ${formatPercent(cell.pct_within_target)} within target (n=${cell.n})`}</title>
              </rect>
              <text
                className="group-bar-value"
                x={cx}
                y={y(cell.pct_within_target) - 5}
                textAnchor="middle"
              >
                {formatPercent(cell.pct_within_target)}
              </text>
              <text
                className="chart-tick"
                transform={`translate(${cx},${baseline + 14}) rotate(-40)`}
                textAnchor="end"
              >
                {label}
              </text>
            </g>
          );
        })}

        <line className="chart-average" x1={PAD.left} x2={W - PAD.right} y1={y(average)} y2={y(average)} />
      </svg>
      <p className="chart-key">
        <span className="chart-key-line" aria-hidden="true" />
        County-wide {formatPercent(average)}
      </p>
    </div>
  );
}
```

### 4.6 `src/features/dashboard/components/VulnerabilityPanel.tsx`

```tsx
// Owner: person 1 — county view addition. Ranks the breakdown groups on a stated formula, then asks
// the server (POST /dashboard/suggest) for options to explore for the selected group. Options come
// from the Action Library; the panel never presents them as a recommendation.
import { useState } from "react";

import { api } from "../../../api/client";
import type { CountyDetail, SuggestionsResult } from "../../../api/types";
import { formatDecimal, formatPercent } from "../../../lib/format";
import { SyntheticBadge } from "./SyntheticBadge";

export const DIMENSION_LABEL: Record<string, string> = {
  age: "age group",
  language: "language",
  ethnicity: "ethnicity",
  education_group: "education group",
  municipality_type: "municipality type",
};

const DIMENSION_COLOUR: Record<string, string> = {
  age: "#0a6670",
  language: "#4f7cae",
  ethnicity: "#c98a00",
  education_group: "#a94f5e",
  municipality_type: "#5b6672",
};

interface Ranked {
  dimension: string;
  group: string;
  pct: number;
  n: number;
  small: boolean;
  score: number;
}

// Missed share discounted by sample size: a 4-person group cannot top a 300-person group.
export function vulnerabilityScore(pctWithinTarget: number, n: number): number {
  return ((100 - pctWithinTarget) * n) / (n + 20);
}

function rank(breakdown: CountyDetail["breakdown"]): Ranked[] {
  const rows: Ranked[] = [];
  for (const [dimension, cells] of Object.entries(breakdown)) {
    if (!cells) continue;
    for (const [group, cell] of Object.entries(cells)) {
      if ("suppressed" in cell) continue;
      rows.push({
        dimension,
        group,
        pct: cell.pct_within_target,
        n: cell.n,
        small: cell.small_sample,
        score: vulnerabilityScore(cell.pct_within_target, cell.n),
      });
    }
  }
  return rows.sort((a, b) => b.score - a.score);
}

const keyOf = (row: Ranked) => `${row.dimension}:${row.group}`;

export function VulnerabilityPanel({
  county,
  breakdown,
}: {
  county: string;
  breakdown: CountyDetail["breakdown"];
}) {
  const ranked = rank(breakdown).slice(0, 5);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestionsResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (ranked.length === 0) return null;
  const active = ranked.find((r) => keyOf(r) === picked) ?? ranked[0];

  const choose = (row: Ranked) => {
    setPicked(keyOf(row));
    setResult(null);
    setFailed(false);
  };

  const ask = async () => {
    setBusy(true);
    setFailed(false);
    setResult(null);
    try {
      setResult(
        await api.suggest({ county, dimension: active.dimension, group: active.group }),
      );
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="group" aria-label="Vulnerability ranking" className="card vuln-panel">
      <div className="key-number-head">
        <h2>Most vulnerable groups</h2>
        <SyntheticBadge />
      </div>
      <p className="vuln-formula">
        Score = missed share × n ÷ (n + 20), so tiny samples do not top the list.
      </p>
      <ol className="vuln-list">
        {ranked.map((row, i) => {
          const colour = DIMENSION_COLOUR[row.dimension] ?? "#5b6672";
          return (
            <li key={keyOf(row)}>
              <button
                type="button"
                className="vuln-button"
                aria-pressed={keyOf(row) === keyOf(active)}
                onClick={() => choose(row)}
                style={{ borderLeftColor: colour }}
              >
                <span className="vuln-rank" style={{ background: colour }}>
                  {i + 1}
                </span>
                <span>
                  <strong className="vuln-group">{row.group}</strong>
                  <span className="vuln-dim">
                    {DIMENSION_LABEL[row.dimension] ?? row.dimension}
                  </span>
                </span>
                <span className="vuln-missed vuln-count">
                  {formatPercent(row.pct)} · n={row.n}
                  {row.small ? " · small" : ""}
                </span>
                <span className="vuln-score" style={{ color: colour }} title="Vulnerability score">
                  {formatDecimal(row.score, 1)}
                  <span className="vuln-score-label">score</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="suggestion-box">
        <h3>
          Possible actions for {active.group} ({DIMENSION_LABEL[active.dimension] ?? active.dimension})
        </h3>
        <p className="muted">
          Options to explore from the Action Library. A person decides; nothing here is a
          recommendation.
        </p>
        <button type="button" onClick={ask} disabled={busy}>
          {busy ? "Asking the model…" : "Suggest options"}
        </button>
        {failed && <p role="alert">The suggestion service did not answer. Try again.</p>}
        {result && <Suggestions result={result} />}
      </div>
    </div>
  );
}

function Suggestions({ result }: { result: SuggestionsResult }) {
  return (
    <div className="suggestion-result">
      <p className="muted">
        {result.source === "ai"
          ? "Written by an AI model from the facts below. It explains options; a person decides."
          : "Generated from the Action Library because the AI service was not available. It explains options; a person decides."}
      </p>
      <p>
        {result.sentences.map((s) => (
          <span key={s.text} className="summary-sentence">
            {s.text}.{" "}
            {s.fact_ids.map((id) => {
              const fact = result.facts.find((f) => f.id === id);
              const n = result.facts.findIndex((f) => f.id === id) + 1;
              return (
                <a
                  key={id}
                  href={fact?.source_url ?? `#suggest-fact-${id}`}
                  {...(fact?.source_url ? { target: "_blank", rel: "noreferrer" } : {})}
                  aria-label={`Source: ${fact?.text ?? id}`}
                >
                  [{n}]
                </a>
              );
            })}{" "}
          </span>
        ))}
      </p>
      <details>
        <summary>Facts the suggestion can use</summary>
        <ol>
          {result.facts.map((f) => (
            <li key={f.id} id={`suggest-fact-${f.id}`}>
              {f.text}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
```

### 4.7 `src/features/dashboard/components/PathwayBar.tsx`

```tsx
// Owner: person 1 — .scratch/equity-dashboard/spec.md
// Days per phase (detection, referral, diagnosis, treatment), coloured where the stage warning is exceeded.
// Bar widths are proportional to days; the number is always printed, so colour is never the only cue.
import type { Phase } from "../../../api/types";
import { formatDecimal } from "../../../lib/format";
import { SyntheticBadge } from "./SyntheticBadge";

const PHASES: { key: Phase; label: string }[] = [
  { key: "detection", label: "Detection" },
  { key: "referral", label: "Referral to first visit" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "treatment", label: "Treatment start" },
];

export function PathwayBar({ days, warning }: { days: Record<Phase, number>; warning: Partial<Record<Phase, number>> }) {
  const total = PHASES.reduce((sum, p) => sum + days[p.key], 0);
  return (
    <div role="group" aria-label="Days per phase" className="card">
      <div className="key-number-head">
        <h2>Days per phase</h2>
        <SyntheticBadge />
      </div>
      <div className="pathway-bar">
        {PHASES.map((p) => {
          const limit = warning[p.key];
          const exceeded = limit !== undefined && days[p.key] > limit;
          return (
            <div
              key={p.key}
              data-testid={`phase-${p.key}`}
              data-exceeded={String(exceeded)}
              className="phase"
              style={{ flexGrow: days[p.key] / total }}
            >
              <span className="phase-label">{p.label}</span>
              <strong>{formatDecimal(days[p.key], 0)} days</strong>
              {limit !== undefined && (
                <span className="muted">
                  {exceeded ? "over the " : "within the "}
                  {limit}-day warning
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 4.8 `src/features/dashboard/components/SyntheticBadge.tsx`

```tsx
// Owner: person 1 — .scratch/equity-dashboard/spec.md
// "Synthetic" chip placed on every number, the map legend, the breakdown, the Cause Codes and the simulation.

export function SyntheticBadge() {
  return (
    <span className="synthetic" title="Synthetic demo figure, not real county data">
      Synthetic
    </span>
  );
}
```

### 4.9 `src/features/dashboard/bands.ts`

```ts
// Owner: person 1 — % within target → band. Boundaries: 59 → under-60, 60–69, 70–79 (Norway), 80+ (Sweden).
export type Band = "under_60" | "60_69" | "70_79" | "80_plus";

export function band(pct: number): Band {
  if (pct >= 80) return "80_plus";
  if (pct >= 70) return "70_79";
  if (pct >= 60) return "60_69";
  return "under_60";
}
```

### 4.10 `src/lib/format.ts`

```ts
// Finnish display formats. Values from the server are ISO; format only here, never in the database.
//   dates   18.11.  or  14.11.2026
//   times   9.30
//   decimals with a comma: 38,6 °C

export function formatDate(iso: string, withYear = false): string {
  const d = new Date(iso);
  const dm = `${d.getDate()}.${d.getMonth() + 1}.`;
  return withYear ? `${dm}${d.getFullYear()}` : dm;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}.${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace(".", ",");
}

// Finnish style: a space before the percent sign. Whole numbers, e.g. "64 %".
export function formatPercent(value: number, digits = 0): string {
  return `${formatDecimal(value, digits)} %`;
}

// A range of fractions as percent: 0.215, 0.43 → "21,5–43 %". Whole numbers stay whole.
export function formatFractionRange(low: number, high: number): string {
  const part = (f: number) => {
    const p = Math.round(f * 1000) / 10;
    return Number.isInteger(p) ? String(p) : formatDecimal(p, 1);
  };
  return `${part(low)}–${part(high)} %`;
}

export function formatTemperature(celsius: number): string {
  return `${formatDecimal(celsius)} °C`;
}
```

### 4.11 `src/api/types.ts` (dashboard-relevant slice)

The real file also contains worklist/booking/alert types. These are the ones the county page uses.

```ts
export interface CountySummary {
  name: string;
  tile: { col: number; row: number };
  pct_within_target: number;
  median_days_referral_to_treatment: number;
  reach_rate_over_75: number;
}

export type BreakdownCell =
  | { suppressed: true }
  | { pct_within_target: number; n: number; small_sample: boolean };

export type Phase = "detection" | "referral" | "diagnosis" | "treatment";

// ethnicity is present only where the fixture provides it (Western Uusimaa for the demo).
export type BreakdownDimension =
  | "age"
  | "language"
  | "ethnicity"
  | "education_group"
  | "municipality_type";

export interface CountyDetail extends CountySummary {
  pct_outside_fast_track: number;
  days_per_phase: Record<Phase, number>;
  stage_warning_days: Record<Phase, number>;
  causes: Record<string, Record<string, number>>;
  breakdown: Partial<Record<BreakdownDimension, Record<string, BreakdownCell>>>;
  insight_card_id?: string;
}

export interface SummaryFact { id: string; text: string; value: number | string; source_url?: string }

export interface SuggestionsResult {
  sentences: { text: string; fact_ids: string[] }[];
  facts: SummaryFact[];
  source: "ai" | "rules";
}
```

### 4.12 `src/api/client.ts` (dashboard slice)

`clientId()` comes from `src/api/clientId.ts` and only adds an `X-Client-Id` header. Keep that file.

```ts
const BASE = "/api";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json", "X-Client-Id": clientId() } : { "X-Client-Id": clientId() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  counties: () => request<CountySummary[]>("GET", "/dashboard/counties"),
  county: (name: string) => request<CountyDetail>("GET", `/dashboard/counties/${encodeURIComponent(name)}`),
  actions: () => request<DashboardAction[]>("GET", "/dashboard/actions"),
  insight: (cardId: string) => request<InsightCardDoc>("GET", `/dashboard/insight/${cardId}`),
  simulate: (body: { card_id: string; dials: Record<string, number> }) =>
    request<SimulationResult>("POST", "/dashboard/simulate", body),
  summary: (cardId: string) => request<SummaryResult>("POST", "/dashboard/summary", { card_id: cardId }),
  suggest: (body: { county: string; dimension: string; group: string }) =>
    request<SuggestionsResult>("POST", "/dashboard/suggest", body),
  createDecision: (body: DecisionInput) => request<DecisionRow>("POST", "/dashboard/decisions", body),
  decisions: (cardId: string) =>
    request<DecisionRow[]>("GET", `/dashboard/decisions?card_id=${encodeURIComponent(cardId)}`),
};
```

### 4.13 `src/styles/tokens.css`

```css
/* Dashboard / Worklist tokens: separate from the patient design system.
   Map bands differ in lightness, not only hue (colour-vision safe); see the dataviz skill. */
:root {
  --bg: #f7f8fa;
  --surface: #ffffff;
  --ink: #16202a;
  --muted: #5b6672;
  --line: #e1e5ea;
  --accent: #0a6670;

  --red: #b02a20;
  --yellow: #c98a00;
  --green: #2e7d4f;

  /* % within target bands */
  --band-under-60: #c7d3e3;
  --band-60-69: #8fa9c9;
  --band-70-79: #4f7cae;   /* meets Norway */
  --band-80-plus: #1f4e82; /* meets Sweden */

  --font: system-ui, "Segoe UI", sans-serif;
  --radius: 10px;
}
```

### 4.14 `src/styles/global.css`

This file also styles the national overview, insight card, login and shell; the county page uses a
subset (`.dashboard`, `.card`, `.key-number*`, `.synthetic`, `.pathway-bar`/`.phase`, `.breakdown*`,
`.dimension-tabs`, `.group-*`, `.chart-*`, `.vuln-*`, `.suggestion-*`).

```css
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font);
  font-size: 15px;
  line-height: 1.45;
}
main { max-width: 1440px; margin: 0 auto; padding: 16px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; }
.synthetic { font-size: 12px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 2px 8px; }

/* Shell */
.demo-bar { display: flex; gap: 12px; align-items: center; justify-content: flex-end; padding: 6px 16px; background: #1a2530; color: #fff; font-size: 13px; }
.demo-bar button { font: inherit; }
.muted { color: var(--muted); }
.login { max-width: 460px; margin: 48px auto; }
.login-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
button, .button-link { font: inherit; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--accent); background: var(--accent); color: #fff; cursor: pointer; text-decoration: none; display: inline-block; }
button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Dashboard */
.dashboard { display: grid; gap: 16px; }
.dashboard h1 { margin: 8px 0 0; }
.key-numbers { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.key-number { text-align: center; }
.key-number .key-number-head { justify-content: center; flex-wrap: wrap; }
.key-number-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.key-number-head h2 { margin: 0; font-size: 17px; }
.key-number-value { font-size: 40px; font-weight: 700; margin: 4px 0; }
.key-number-value .unit { font-size: 16px; font-weight: 400; }
.bench-bar { position: relative; height: 10px; background: var(--line); border-radius: 5px; margin: 8px 0 4px; }
.bench-fill { height: 100%; background: var(--band-70-79); border-radius: 5px; }
.bench-line { position: absolute; top: -4px; width: 2px; height: 18px; background: var(--ink); }
.bench-labels { display: flex; justify-content: center; gap: 16px; list-style: none; margin: 0; padding: 0; font-size: 13px; color: var(--muted); }

.tile-map-wrap { display: flex; flex-direction: column; align-items: center; }
.tile-map { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; width: 100%; margin: 12px 0; }
.tile { display: flex; flex-direction: column; justify-content: space-between; min-height: 72px; padding: 8px; border-radius: 8px; text-decoration: none; color: var(--ink); border: 2px solid transparent; }
.tile-name { font-size: 13px; font-weight: 600; }
.tile-pct { font-size: 18px; font-weight: 700; }
.tile[data-demo-county="true"] { border-color: var(--ink); outline: 3px solid var(--accent); outline-offset: 1px; }
[data-band="under_60"] { background: var(--band-under-60); }
[data-band="60_69"] { background: var(--band-60-69); }
[data-band="70_79"] { background: var(--band-70-79); color: #fff; }
[data-band="80_plus"] { background: var(--band-80-plus); color: #fff; }
.tile[data-band="70_79"], .tile[data-band="80_plus"] { color: #fff; }
.band-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 20px; list-style: none; padding: 0; margin: 0; font-size: 13px; }
.swatch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; vertical-align: -2px; border: 1px solid rgba(0, 0, 0, 0.25); }
.caveat { font-size: 13px; padding: 8px 0; }

.pathway-bar { display: flex; gap: 4px; margin-top: 8px; }
.phase { display: flex; flex-direction: column; gap: 2px; min-width: 110px; padding: 10px; border-radius: 8px; background: var(--band-under-60); }
.phase[data-exceeded="true"] { background: #f3c9c4; border: 2px solid var(--red); }
.phase-label { font-size: 13px; }
.breakdown { display: grid; gap: 12px; }
.breakdown-head { align-items: flex-start; }
.breakdown-title { margin: 0; font-size: 20px; }
.breakdown-head .muted { margin: 4px 0 0; }
.dimension-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.dimension-tabs button { padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font-size: 13px; }
.dimension-tabs button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent); color: #fff; }
.breakdown-table { width: 100%; border-collapse: collapse; font-size: 16px; }
.breakdown-table caption { padding: 4px 0 8px; text-align: left; font-size: 13px; color: var(--muted); }
.breakdown-table .col-count { width: 130px; }
.breakdown-table .col-share { width: 210px; }
.breakdown-table thead th { padding: 8px 10px; border-bottom: 2px solid var(--line); background: #f2f4f7; text-align: left; font-size: 12px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; color: var(--muted); }
.breakdown-table thead th:nth-child(2), .breakdown-table thead th:nth-child(3) { text-align: right; }
.breakdown-table tbody tr:nth-child(even) { background: #fafbfc; }
.breakdown-table th[scope="row"] { padding: 10px; border-top: 1px solid var(--line); text-align: left; font-weight: 500; white-space: nowrap; }
.breakdown-table td { padding: 10px; border-top: 1px solid var(--line); vertical-align: middle; }
.breakdown-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
.breakdown-table td:nth-child(3) { text-align: right; }
.breakdown-pct { display: block; font-size: 20px; font-weight: 700; line-height: 1.15; }
.group-chart { display: grid; gap: 4px; }
.group-bars { width: 100%; height: auto; display: block; overflow: visible; }
.chart-key { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 12px; color: var(--muted); }
.chart-key-line { width: 28px; border-top: 2px dashed var(--ink); }
.group-bar[data-band="under_60"] { fill: var(--band-under-60); }
.group-bar[data-band="60_69"] { fill: var(--band-60-69); }
.group-bar[data-band="70_79"] { fill: var(--band-70-79); }
.group-bar[data-band="80_plus"] { fill: var(--band-80-plus); }
.group-bar-value { font-size: 10px; font-weight: 700; fill: var(--ink); }
.chart-tick { font-size: 10px; fill: var(--muted); }
.warn { color: var(--yellow); font-size: 13px; }

.chart-grid line { stroke: var(--line); stroke-width: 1; }
.chart-axis text { font-size: 11px; fill: var(--muted); }
.chart-axis .chart-axis-label { font-size: 12px; }
.chart-average { stroke: var(--ink); stroke-width: 1.5; stroke-dasharray: 5 4; }

.vuln-panel { display: grid; gap: 12px; }
.vuln-formula { margin: 0; font-size: 13px; color: var(--muted); }
.vuln-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.vuln-button { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto auto; gap: 16px; align-items: center; width: 100%; padding: 14px 16px; text-align: left; border: 1px solid var(--line); border-left: 5px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); cursor: pointer; }
.vuln-button:hover { background: #f7f9fb; }
.vuln-button[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.vuln-rank { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: #fff; font-size: 16px; font-weight: 800; }
.vuln-group { font-size: 17px; }
.vuln-dim { display: block; margin-top: 2px; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
.vuln-missed { font-size: 14px; color: var(--muted); }
.vuln-score { text-align: right; font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; }
.vuln-score-label { display: block; margin-top: 3px; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.suggestion-box { display: grid; gap: 8px; padding-top: 12px; border-top: 1px solid var(--line); }
.suggestion-box h3 { margin: 0; font-size: 16px; }
.suggestion-result { display: grid; gap: 8px; }
.suggestion-result p { margin: 0; }

.cause-list { list-style: none; padding: 0; margin: 8px 0 0; display: grid; gap: 6px; }
.cause-list li { display: grid; grid-template-columns: 150px 1fr 56px; gap: 8px; align-items: center; }
.cause-bar { background: var(--line); height: 10px; border-radius: 5px; overflow: hidden; }
.cause-bar span { display: block; height: 100%; background: var(--band-70-79); }

.actions-row { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
.action { border: 1px solid var(--line); border-radius: var(--radius); padding: 12px; }
.action h3 { margin: 0 0 8px; font-size: 16px; }
.evidence-badge { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--ink); }
.evidence-links { padding-left: 18px; font-size: 13px; }
.no-effect { font-style: italic; color: var(--muted); }
.dial input[type="range"] { width: 100%; }
.sim-rows { list-style: none; padding: 0; display: grid; gap: 8px; }
textarea, input:not([type="radio"]) { display: block; width: 100%; font: inherit; padding: 6px 8px; margin: 4px 0 12px; }
fieldset { border: 0; padding: 0; margin: 0 0 12px; }
fieldset label { margin-right: 16px; }

@media (max-width: 720px) {
  .tile-map { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pathway-bar { flex-direction: column; }
  .cause-list li { grid-template-columns: 110px 1fr 50px; }
  .vuln-button { grid-template-columns: 40px minmax(0, 1fr) auto; }
  .vuln-count { display: none; }
}
```

### 4.15 `package.json` and `vite.config.ts`

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  }
}
```

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: { "/api": { target: "http://localhost:8000", rewrite: (p) => p.replace(/^\/api/, "") } },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
```

---

## 5. Server code

### 5.1 `server/app/routers/dashboard.py` (county + suggest slice)

Full file also has simulation, summary and decision endpoints. These are the pieces this page uses.

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import db
from app.fixtures.seed import county_id
from app.services import nemotron, summary_facts
from app.services.summary_filter import filter_sentences

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

SUPPRESS_BELOW = 5      # "not enough data", no value returned
SMALL_SAMPLE_BELOW = 20 # value returned with a warning


def _protect(cell: dict) -> dict:
    if cell["n"] < SUPPRESS_BELOW:
        return {"suppressed": True}
    return {**cell, "small_sample": cell["n"] < SMALL_SAMPLE_BELOW}


@router.get("/counties/{name}")
async def county(name: str):
    """n < 5 cells → { suppressed: true }; n < 20 → small_sample: true."""
    doc = await db.get("counties", county_id(name))
    if doc is None:
        raise HTTPException(status_code=404, detail="unknown county")
    doc["breakdown"] = {
        dimension: {label: _protect(cell) for label, cell in cells.items()}
        for dimension, cells in doc["breakdown"].items()
    }
    # Stage warning thresholds live with the card fixture (one set for the demo).
    cards = await db.find("insight_cards", limit=1)
    doc["stage_warning_days"] = cards[0]["stage_warning_days"] if cards else {}
    return doc


SUGGEST_SYSTEM_PROMPT = (
    "You help a county team explore possible actions for one demographic group. Use only the "
    "numbered facts you are given. Write at most 3 short sentences in plain English. End every "
    "sentence with the ids of the facts it uses in square brackets, like [group_pct]. Describe "
    "options to explore from the Action Library; never recommend, rank or decide. Say that a "
    "person decides. All figures are synthetic demo data."
)

DIMENSION_LABEL = {
    "age": "age group",
    "language": "language group",
    "ethnicity": "ethnicity group",
    "education_group": "education group",
    "municipality_type": "municipality type",
}


def _suggestion_facts(doc: dict, dimension: str, group: str, cell: dict, actions: list[dict]) -> list[dict]:
    label = DIMENSION_LABEL.get(dimension, dimension.replace("_", " "))
    facts = [
        {"id": "group_pct", "value": cell["pct_within_target"],
         "text": f"{cell['pct_within_target']:.0f}% of {group} ({label}) in {doc['name']} start treatment within the target (n={cell['n']})"},
        {"id": "county_pct", "value": doc["pct_within_target"],
         "text": f"{doc['pct_within_target']:.0f}% of all patients in {doc['name']} start treatment within the target"},
    ]
    for cause, share in doc["causes"].get("referral", {}).items():
        facts.append({"id": f"cause_{cause}", "value": share,
                      "text": f"{share * 100:.0f}% of delayed referral stages are Cause Code '{cause.replace('_', ' ')}'"})
    for action in actions:
        eff = action.get("effect")
        text = f"{action['title']} (evidence badge: {action['badge']}"
        if eff:
            text += f"; evidence shows {eff['low'] * 100:.0f}-{eff['high'] * 100:.0f}% fewer missed visits"
        else:
            text += "; no effect estimate"
        fact = {"id": f"action_{action['_id']}", "value": action["badge"], "text": text + ")"}
        if action["evidence"]:
            fact["source_url"] = action["evidence"][0]["url"]
        facts.append(fact)
    return facts


def _rule_sentences(doc: dict, dimension: str, group: str, cell: dict, actions: list[dict]) -> list[dict]:
    label = DIMENSION_LABEL.get(dimension, dimension.replace("_", " "))
    sentences = [{
        "text": (f"Only {cell['pct_within_target']:.0f}% of {group} ({label}) in {doc['name']} start "
                 f"treatment within the target, against {doc['pct_within_target']:.0f}% county-wide"),
        "fact_ids": ["group_pct", "county_pct"],
    }]
    if actions:
        sentences.append({
            "text": "Options to explore in the Action Library: " + "; ".join(a["title"] for a in actions),
            "fact_ids": [f"action_{a['_id']}" for a in actions],
        })
    with_effect = [a for a in actions if a.get("effect")]
    if with_effect:
        action, eff = with_effect[0], with_effect[0]["effect"]
        sentences.append({
            "text": (f"The evidence for {action['title']} shows "
                     f"{eff['low'] * 100:.0f}-{eff['high'] * 100:.0f}% fewer missed visits"),
            "fact_ids": [f"action_{action['_id']}"],
        })
    return sentences


class SuggestBody(BaseModel):
    county: str
    dimension: str
    group: str


@router.post("/suggest")
async def suggest(body: SuggestBody):
    """Facts-only options for one group. Model unavailable → Action Library rules."""
    doc = await db.get("counties", county_id(body.county))
    if doc is None:
        raise HTTPException(status_code=404, detail="unknown county")
    cells = doc["breakdown"].get(body.dimension)
    if cells is None or body.group not in cells:
        raise HTTPException(status_code=404, detail="unknown group")
    cell = _protect(cells[body.group])
    if cell.get("suppressed"):
        raise HTTPException(status_code=422, detail="not enough data for this group")
    actions = [a for a in await db.find("actions") if a["gap_pattern"]["phase"] == "referral"]
    facts = _suggestion_facts(doc, body.dimension, body.group, cell, actions)
    valid = {f["id"] for f in facts}
    sentences: list[dict] = []
    try:
        reply = await nemotron.complete(SUGGEST_SYSTEM_PROMPT, summary_facts.build_prompt(facts), timeout_s=20)
        sentences = filter_sentences(reply, valid)
    except Exception:
        sentences = []
    if sentences:
        return {"sentences": sentences, "facts": facts, "source": "ai"}
    return {
        "sentences": _rule_sentences(doc, body.dimension, body.group, cell, actions),
        "facts": facts,
        "source": "rules",
    }
```

### 5.2 Western Uusimaa fixture (`server/app/fixtures/counties.json`, one object)

```json
{
  "name": "Western Uusimaa",
  "tile": { "col": 1, "row": 6 },
  "synthetic": true,
  "pct_within_target": 53.6,
  "median_days_referral_to_treatment": 39,
  "reach_rate_over_75": 70,
  "pct_outside_fast_track": 21,
  "days_per_phase": {
    "detection": 23.9,
    "referral": 13.1,
    "diagnosis": 22.4,
    "treatment": 15.3
  },
  "causes": {
    "referral": {
      "unconfirmed": 0.21,
      "transport": 0.24,
      "waiting_for_slot": 0.55
    }
  },
  "breakdown": {
    "age": {
      "18-39": { "pct_within_target": 72.4, "n": 14 },
      "40-49": { "pct_within_target": 68.1, "n": 104 },
      "50-59": { "pct_within_target": 64.0, "n": 76 },
      "60-64": { "pct_within_target": 59.0, "n": 43 },
      "65-74": { "pct_within_target": 60.4, "n": 321 },
      "75-84": { "pct_within_target": 38.8, "n": 168 },
      "85+": { "pct_within_target": 29.7, "n": 105 }
    },
    "language": {
      "Finnish": { "pct_within_target": 54.1, "n": 721 },
      "Swedish": { "pct_within_target": 59.2, "n": 33 },
      "Russian": { "pct_within_target": 39.8, "n": 38 },
      "Estonian": { "pct_within_target": 44.4, "n": 18, "small_sample": true },
      "Ukrainian": { "pct_within_target": 43.8, "n": 8, "small_sample": true },
      "Arabic": { "pct_within_target": 36.5, "n": 7, "small_sample": true },
      "Other": { "pct_within_target": 50.0, "n": 6, "small_sample": true }
    },
    "ethnicity": {
      "Finnish-born": { "pct_within_target": 56.4, "n": 655 },
      "Foreign-born (EU/EEA)": { "pct_within_target": 45.6, "n": 54 },
      "Foreign-born (non-EU)": { "pct_within_target": 39.8, "n": 104 },
      "Not recorded": { "pct_within_target": 47.2, "n": 18, "small_sample": true }
    },
    "education_group": {
      "basic": { "pct_within_target": 48.2, "n": 269 },
      "upper secondary": { "pct_within_target": 55.5, "n": 347 },
      "tertiary": { "pct_within_target": 57.5, "n": 215 }
    },
    "municipality_type": {
      "urban": { "pct_within_target": 55.0, "n": 526 },
      "semi-urban": { "pct_within_target": 52.5, "n": 264 },
      "rural": { "pct_within_target": 43.4, "n": 41 }
    }
  },
  "insight_card_id": "western-uusimaa/missed-first-visits-75"
}
```

### 5.3 Stage warnings (`server/app/fixtures/insight_cards.json`)

The county endpoint injects these; the card fixture is the single source.

```json
"stage_warning_days": { "detection": 28, "referral": 10, "diagnosis": 21, "treatment": 14 }
```

---

## 6. Design decisions and known gaps

Decisions worth keeping:

- **One dimension at a time** via pills, not five stacked cards. Research referenced by the repo owner:
  Power BI (pies poor for comparison, column/bar preferred), Tableau and Omni (2–5 views per
  dashboard), National Equity Atlas (bar charts for group comparisons).
- **Columns, not pies.** Pies showed patient composition and duplicated the table's n.
- **Shared 0–100 axis** across dimensions so switching does not change the scale.
- **County-wide line is constant** (53.6 %). It is the whole-county rate; each dimension's n-weighted
  mean is 53.16–53.65, so the line is consistent, not stale.
- **No line chart**: the fixture has no per-group time series.
- **Table is the exact source of truth**; the chart is the comparison view. Values are printed on bars
  and in the table.
- **Suppression is server-side**; the UI never receives a value for `n < 5`.
- **Ranking formula is stated in the UI** and small samples are discounted by `n / (n + 20)`.
- **No recommendation language.** Suggestions are "options to explore"; `source` discloses AI vs rules.

Known gaps:

- **No visual verification**: no browser was available, so label spacing/table alignment is unconfirmed.
- **Nemotron is unconfigured** here, so suggestions return `source: "rules"` (deterministic Action
  Library text). `NEMOTRON_BASE_URL`, `NEMOTRON_MODEL` and `NEMOTRON_API_KEY`/key file are unset.
- **Insight Card data is stale**: `.scratch` card baseline is still 46 % / n=186 for "75+", and its
  cached summary says "64 % across the county"; the county fixture is now 53.6 %. The county page's
  link to that card will expose the mismatch.
- **Only Western Uusimaa has ethnicity**; other counties render four tabs.
- **`counties.json` keys arrive unordered from JSONB**; `EquityBreakdown.ORDER` fixes display order.
- **No auth guard** on `/dashboard/county/...`; role from `getSession()` is not enforced.
- **Tests are outdated** per the project owner; only `tsc -b` and `vite build` are used.

---

## 7. Not included

These exist in the repo and wrap the page, but are not part of this handoff:

- `src/shell/AppShell.tsx`, `DemoBar` and `LoginScreen` (the page renders inside the shell).
- `NationalOverview` (level 1), `InsightCard` (level 3), `NationalOverview`'s `TileMap` and
  `KeyNumber`.
- Worklist/booking/symptom screens and `features/worklist/worklist.css`.
- `server/app/services/` (simulation, summary facts/filter, Nemotron client) and `db.py`.
- `src/api/clientId.ts` (needed by the client; adds only `X-Client-Id`).
