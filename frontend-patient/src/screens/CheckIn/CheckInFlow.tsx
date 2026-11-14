// Owner: person 2 — design port of app/check-in.html (artboard "7 · Symptom check-in").
// ~10 items from GET /rules checkin_items, one per screen: "Weekly check-in", a bar with "4 of 10",
// the question as a legend, 96 px option tiles, then Previous / Next. POST /patients/{id}/checkin
// on the last item. The client never grades.
import { useEffect, useMemo, useState } from "react";

import { api } from "../../api/client";
import type { AdviceShown, Question } from "../../api/types";
import { NumberPad, parseNumber } from "../../components/NumberPad";
import { actorFields, getSession } from "../../lib/session";
import { useFlowBack } from "../../shell/FlowBack";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";
import { CheckRing, OptionIcon } from "../SymptomReport/R4GuidedQuestion";
import { CheckInResult } from "./CheckInResult";

export function CheckInFlow() {
  const [items, setItems] = useState<Question[]>();
  const [index, setIndex] = useState(0);
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AdviceShown>();
  const [error, setError] = useState<string>();
  const patientId = getSession()?.patientId ?? "";

  useEffect(() => {
    api.rules().then((r) => setItems(r.checkin_items)).catch(() => setError("Could not load the questions. Please try again."));
  }, []);

  const q = items?.[index];
  const answer = q ? (raw[q.id] ?? "") : "";
  const answered = answer !== "";
  const last = items ? index === items.length - 1 : false;

  const send = async () => {
    if (!items) return;
    const answers = Object.fromEntries(
      items.map((i) => [i.id, i.kind === "number" ? parseNumber(raw[i.id]) : raw[i.id]]),
    );
    try {
      const res = await api.checkin(patientId, { answers, ...actorFields() });
      setResult(res.advice_shown);
    } catch {
      setError("Your check-in could not be sent. If you feel worse, phone 116 117 or 112.");
    }
  };

  const goNext = () => {
    if (!answered) return;
    if (last) void send();
    else setIndex(index + 1);
  };
  const previous = () => setIndex(Math.max(0, index - 1));

  const readable = useMemo(() => ({ heading: q?.prompt ?? "Weekly check-in" }), [q]);
  useReadable(readable);

  const actions = useMemo(() => {
    if (!q) return [];
    return [
      ...(q.kind === "choice"
        ? (q.options ?? []).map((o) => ({
            id: `checkin:${q.id}:${o.id}`,
            label: o.label,
            run: () => setRaw((r) => ({ ...r, [q.id]: o.id })),
          }))
        : []),
      {
        id: "checkin:next",
        label: last ? "Send check-in" : "Next question",
        synonyms: ["next"],
        run: goNext,
      },
      ...(index > 0 ? [{ id: "checkin:prev", label: "Previous", run: previous }] : []),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, answered, index, last]);
  useVoiceActions(actions);

  // The header's Back steps to the previous question instead of leaving the check-in;
  // on the first question (and on the result) there is nothing inside the flow to undo.
  const back = useMemo<(() => void) | null>(
    () => (index > 0 ? () => setIndex(index - 1) : null),
    [index],
  );
  useFlowBack(back);

  if (result) return <CheckInResult advice={result} />;
  if (!items || !q) return error ? <p role="alert">{error}</p> : <p>Loading…</p>;

  const step = index + 1;
  const percent = Math.round((step / items.length) * 100);

  return (
    <section className="report-q checkin">
      <div className="q-head">
        <h1 className="ci-title">Weekly check-in</h1>
        <div className="q-progress">
          <span className="q-bar"><span className="q-bar-fill" style={{ width: `${percent}%` }} /></span>
          <span className="q-count">{step} of {items.length}</span>
        </div>
      </div>

      <fieldset className="q-field">
        <legend className="q-prompt">{q.prompt}</legend>
        {q.kind === "choice" ? (
          <div className="q-options">
            {(q.options ?? []).map((o) => (
              <label key={o.id} className="q-opt" data-selected={answer === o.id}>
                <input
                  type="radio"
                  name={q.id}
                  value={o.id}
                  checked={answer === o.id}
                  onChange={() => setRaw({ ...raw, [q.id]: o.id })}
                />
                <span className="q-opt-icons">
                  <span className="q-opt-icon"><OptionIcon id={o.id} /></span>
                  <span className="q-check"><CheckRing on={answer === o.id} /></span>
                </span>
                <span className="q-opt-label">{o.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <NumberPad
            value={answer}
            onChange={(v) => setRaw({ ...raw, [q.id]: v })}
            allowDecimal
            label={q.unit ?? "Your answer"}
          />
        )}
      </fieldset>

      {error && <p role="alert">{error}</p>}

      <div className="ci-actions">
        <button type="button" onClick={previous} disabled={index === 0}>Previous</button>
        <button type="button" className="primary" disabled={!answered} onClick={goNext}>
          {last ? "Send check-in" : "Next question"}
        </button>
      </div>
    </section>
  );
}
