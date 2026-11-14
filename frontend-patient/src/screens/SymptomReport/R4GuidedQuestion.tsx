// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "R4 · Guided questions")
// One question per screen from GET /rules, tap-only (ChoiceList) or NumberPad for numbers.
// Never grades.
import { useMemo, useState } from "react";

import type { Question } from "../../api/types";
import { ChoiceList } from "../../components/ChoiceList";
import { NumberPad, parseNumber } from "../../components/NumberPad";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

interface Props {
  question: Question;
  onAnswer: (value: string | number) => void;
}

export function R4GuidedQuestion({ question, onAnswer }: Props) {
  const [value, setValue] = useState("");
  const readable = useMemo(() => ({ heading: question.prompt }), [question.prompt]);
  useReadable(readable);
  const choices = useMemo(() => question.options ?? [], [question.options]);
  const pickChoice = (id: string) => onAnswer(id);
  const submitNumber = () => value !== "" && onAnswer(parseNumber(value));
  const numberActions = useMemo(
    () =>
      question.kind === "number"
        ? [{ id: "number:answer", label: "Answer", kind: "number" as const, run: (n?: number) => { if (n !== undefined) onAnswer(n); } }]
        : [],
    [question.kind, onAnswer],
  );
  useVoiceActions(numberActions);

  return (
    <section>
      <h1>{question.prompt}</h1>
      {question.kind === "choice" ? (
        <ChoiceList choices={choices} onPick={pickChoice} />
      ) : (
        <>
          <NumberPad value={value} onChange={setValue} allowDecimal label={question.unit ?? "Your answer"} />
          {question.unit && <p>{question.unit}</p>}
          <button type="button" className="primary" disabled={value === ""} onClick={submitNumber}>Next</button>
        </>
      )}
    </section>
  );
}
