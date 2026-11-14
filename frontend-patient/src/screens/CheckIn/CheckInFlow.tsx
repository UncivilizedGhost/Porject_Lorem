// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "7 · Symptom check-in (phase 3)")
// ~10 items from GET /rules checkin_items, one per screen, ProgressBar, Previous/Next,
// temperature on NumberPad → POST /patients/{id}/checkin → CheckInResult. The client never grades.
import { useEffect, useMemo, useState } from "react";

import { api } from "../../api/client";
import type { AdviceShown, Question } from "../../api/types";
import { ChoiceList } from "../../components/ChoiceList";
import { NumberPad, parseNumber } from "../../components/NumberPad";
import { ProgressBar } from "../../components/ProgressBar";
import { actorFields, getSession } from "../../lib/session";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";
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
  const readable = useMemo(() => ({ heading: q?.prompt ?? "Check-in" }), [q]);
  useReadable(readable);
  const answered = q ? (raw[q.id] ?? "") !== "" : false;
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
  const next = () => (last ? send() : setIndex(index + 1));
  const navActions = useMemo(
    () => [
      { id: "checkin:next", label: last ? "Send check-in" : "Next", synonyms: ["next"], run: () => { if (answered) void next(); } },
      ...(index > 0 ? [{ id: "checkin:prev", label: "Previous", run: () => setIndex(index - 1) }] : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, last, answered],
  );
  useVoiceActions(navActions);

  if (result) return <CheckInResult advice={result} />;
  if (!items || !q) return error ? <p role="alert">{error}</p> : <p>Loading…</p>;

  return (
    <section>
      <ProgressBar step={index + 1} total={items.length} />
      <h1>{q.prompt}</h1>
      {q.kind === "choice" ? (
        <ChoiceList
          choices={q.options ?? []}
          selected={raw[q.id]}
          onPick={(id) => setRaw({ ...raw, [q.id]: id })}
        />
      ) : (
        <NumberPad
          value={raw[q.id] ?? ""}
          onChange={(v) => setRaw({ ...raw, [q.id]: v })}
          allowDecimal
          label={q.unit ?? "Your answer"}
        />
      )}
      {error && <p role="alert">{error}</p>}
      {index > 0 && <button type="button" onClick={() => setIndex(index - 1)}>Previous</button>}
      <button type="button" className="primary" disabled={!answered} onClick={next}>
        {last ? "Send check-in" : "Next"}
      </button>
    </section>
  );
}
