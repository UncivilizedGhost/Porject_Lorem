// Owner: person 1 — .scratch/equity-dashboard/spec.md
// Renders POST /dashboard/summary: every sentence carries links to the facts it cites (the evidence
// URL when the fact has one, else an anchor to the fact list below). Says when the text is pre-written or rule-built.
import type { SummaryResult } from "../../../api/types";

export function AiSummary({ summary }: { summary: SummaryResult | null }) {
  return (
    <section aria-label="AI summary" className="card">
      <h2>AI summary</h2>
      {!summary ? (
        <p role="status" className="loading">Writing the summary…</p>
      ) : (
        <>
          <p className="muted">
            {summary.source === "live"
              ? "Written by an AI model from the facts below."
              : summary.source === "pregenerated"
                ? "Written by an AI model ahead of time from the facts below."
                : "Built from the facts below by fixed rules, because the AI service was not available."}
          </p>
          <p>
            {summary.sentences.map((s) => (
              <span key={s.text} className="summary-sentence">
                {s.text}.{" "}
                {s.fact_ids.map((id) => {
                  const fact = summary.facts.find((f) => f.id === id);
                  const n = summary.facts.findIndex((f) => f.id === id) + 1;
                  return (
                    <a
                      key={id}
                      href={fact?.source_url ?? `#fact-${id}`}
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
            <summary>Facts the summary can use</summary>
            <ol>
              {summary.facts.map((f) => (
                <li key={f.id} id={`fact-${f.id}`}>{f.text}</li>
              ))}
            </ol>
          </details>
        </>
      )}
    </section>
  );
}
