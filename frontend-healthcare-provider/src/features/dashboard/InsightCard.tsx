// Owner: person 1 — .scratch/equity-dashboard/spec.md (artboard "Equity dashboard · 3 Insight Card")
// Order: what/where/who → CauseCodes → AiSummary → MatchedActions (side by side, "Matched" never
// "Recommended") → SimulationPanel (ranges, needed vs evidence shows) → DecisionForm → DecisionLog.
// The dials live here; moving one re-calls POST /dashboard/simulate, debounced.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../api/client";
import type { CountyDetail, InsightCardDoc, SimulationResult, SummaryResult } from "../../api/types";
import { AiSummary } from "./components/AiSummary";
import { CauseCodes } from "./components/CauseCodes";
import { DecisionForm } from "./components/DecisionForm";
import { DecisionLog } from "./components/DecisionLog";
import { MatchedActions } from "./components/MatchedActions";
import { SimulationPanel } from "./components/SimulationPanel";

const DEBOUNCE_MS = 200;

export function InsightCard() {
  const { name = "", cardSlug = "" } = useParams();
  const cardId = `${name.toLowerCase().replace(/ /g, "-")}/${cardSlug}`;

  const [card, setCard] = useState<InsightCardDoc | null>(null);
  const [county, setCounty] = useState<CountyDetail | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [dials, setDials] = useState<Record<string, number>>({});
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [logKey, setLogKey] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.insight(cardId).then((c) => {
      setCard(c);
      api.county(c.where).then(setCounty).catch(() => undefined);
    }).catch(() => setFailed(true));
    api.summary(cardId).then(setSummary).catch(() => setSummary(null));
  }, [cardId]);

  useEffect(() => {
    if (!card) return;
    const t = setTimeout(() => {
      api.simulate({ card_id: cardId, dials }).then(setSimulation).catch(() => undefined);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [card, cardId, dials]);

  const back = <Link className="back-link" to={`/dashboard/county/${encodeURIComponent(name)}`}>← {name}</Link>;
  if (failed) return <p role="alert">Could not load this Insight Card. {back}</p>;
  if (!card) return <p role="status" className="loading">Loading…</p>;

  return (
    <div className="dashboard">
      {back}
      <h1>{card.what}</h1>
      <div className="card card-facts">
        <p>Where: {card.where}</p>
        <p>Who: {card.who}</p>
      </div>
      {county && <CauseCodes shares={county.causes[card.stage] ?? {}} />}
      <AiSummary summary={summary} />
      <MatchedActions
        actions={card.matched_actions}
        dials={dials}
        onDial={(id, value) => setDials((d) => ({ ...d, [id]: value }))}
      />
      <SimulationPanel result={simulation} actions={card.matched_actions} />
      <DecisionForm
        cardId={cardId}
        actions={card.matched_actions}
        facts={summary?.facts ?? []}
        simulation={simulation}
        onSaved={() => setLogKey((k) => k + 1)}
      />
      <DecisionLog cardId={cardId} refreshKey={logKey} />
    </div>
  );
}
