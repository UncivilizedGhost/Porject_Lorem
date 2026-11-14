// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "R1–R6")
// Drives machine.ts; renders R1–R6; one submit at the end → POST /patients/{id}/symptom-report;
// R2 for call_now, R6 for nurse_review / self_care. A Safety Check tap goes to R2 straight away
// (fixed behaviour, not grading) and the report is still submitted so the Worklist gets a row.
import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../../api/client";
import type { Question, RulesCatalogue } from "../../api/types";
import { actorFields, getSession } from "../../lib/session";
import { useVoiceActions } from "../../voice/useVoiceActions";
import { initialDraft, type ReportDraft, type Step } from "./machine";
import { R1SafetyCheck } from "./R1SafetyCheck";
import { R2CallNow } from "./R2CallNow";
import { R3PickSymptom } from "./R3PickSymptom";
import { R4GuidedQuestion } from "./R4GuidedQuestion";
import { R5OwnWords } from "./R5OwnWords";
import { R6Sent } from "./R6Sent";

function questionsFor(rules: RulesCatalogue, symptom: string): Question[] {
  if (symptom === "other") return rules.other_symptom_questions;
  return rules.symptoms.find((s) => s.id === symptom)?.questions ?? [];
}

function MoreOrDone({ onMore, onDone }: { onMore: () => void; onDone: () => void }) {
  const actions = useMemo(
    () => [
      { id: "more:add", label: "Add another symptom", run: onMore },
      { id: "more:done", label: "No, that's all", run: onDone },
    ],
    [onMore, onDone],
  );
  useVoiceActions(actions);
  return (
    <section>
      <h1>Anything else?</h1>
      <button type="button" onClick={onMore}>Add another symptom</button>
      <button type="button" className="primary" onClick={onDone}>No, that's all</button>
    </section>
  );
}

export function SymptomReportFlow() {
  const [rules, setRules] = useState<RulesCatalogue>();
  // /report opens on the artboard's pick page. The Safety Check is still one tap away through
  // the red "Very unwell right now" tile, which goes straight to Call now.
  const [step, setStep] = useState<Step | { screen: "more" }>({ screen: "R3" });
  const [draft, setDraft] = useState<ReportDraft>(initialDraft);
  const [pending, setPending] = useState<Record<string, string | number>>({});
  const [error, setError] = useState<string>();

  useEffect(() => {
    api.rules().then(setRules).catch(() => setError("Could not load the questions. Please try again."));
  }, []);

  const patientId = getSession()?.patientId ?? "";
  const submit = useCallback(
    (d: ReportDraft) =>
      api.symptomReport(patientId, {
        safety_check: { ticked: d.ticked },
        symptoms: d.symptoms,
        own_words: d.own_words,
        ...actorFields(),
      }),
    [patientId],
  );

  const tick = useCallback(
    (item: { id: string; label: string }) => {
      const d = { ...initialDraft, ticked: [item.id] };
      setStep({ screen: "R2", reason: item.label });
      submit(d).catch(() => setError("Your report could not be sent, but you can still call now."));
    },
    [submit],
  );
  const none = useCallback(() => setStep({ screen: "R3" }), []);
  // The red tile on Pick a symptom: same fixed behaviour as a Safety Check tap, no grading.
  const urgent = useCallback(() => setStep({ screen: "R2", reason: "Very unwell right now" }), []);
  const more = useCallback(() => setStep({ screen: "R3" }), []);
  const done = useCallback(() => setStep({ screen: "R5" }), []);

  if (error && !rules) return <p role="alert">{error}</p>;
  if (!rules) return <p>Loading…</p>;

  const labels = Object.fromEntries(rules.symptoms.map((s) => [s.id, s.label]));

  const finish = async (ownWords: ReportDraft["own_words"]) => {
    const d = { ...draft, own_words: ownWords };
    setDraft(d);
    try {
      const result = await submit(d);
      if (result.advice_shown === "call_now") {
        setStep({ screen: "R2", reason: d.symptoms.map((s) => labels[s.symptom] ?? s.symptom).join(", ") || "" });
      } else {
        setStep({ screen: "R6", advice: result.advice_shown });
      }
    } catch {
      setError("Your report could not be sent. If it is urgent, phone 116 117 or 112.");
    }
  };

  const answer = (symptom: string, index: number, qs: Question[], qid: string, value: string | number) => {
    const answers = { ...pending, [qid]: value };
    if (index + 1 < qs.length) {
      setPending(answers);
      setStep({ screen: "R4", symptom, questionIndex: index + 1 });
    } else {
      setDraft((d) => ({ ...d, symptoms: [...d.symptoms, { symptom, answers }] }));
      setPending({});
      setStep({ screen: "more" });
    }
  };

  return (
    <>
      {error && <p role="alert">{error}</p>}
      {step.screen === "R1" && <R1SafetyCheck items={rules.safety_check_items} onTick={tick} onNone={none} />}
      {step.screen === "R2" && <R2CallNow reason={step.reason || null} />}
      {step.screen === "R3" && (
        <R3PickSymptom
          symptoms={rules.symptoms}
          onUrgent={urgent}
          onPick={(symptom) => {
            const qs = questionsFor(rules, symptom);
            if (qs.length === 0) {
              setDraft((d) => ({ ...d, symptoms: [...d.symptoms, { symptom, answers: {} }] }));
              setStep({ screen: "more" });
            } else {
              setPending({});
              setStep({ screen: "R4", symptom, questionIndex: 0 });
            }
          }}
        />
      )}
      {step.screen === "R4" &&
        (() => {
          const qs = questionsFor(rules, step.symptom);
          const q = qs[step.questionIndex];
          return (
            <R4GuidedQuestion
              key={`${step.symptom}-${q.id}`}
              question={q}
              onAnswer={(v) => answer(step.symptom, step.questionIndex, qs, q.id, v)}
            />
          );
        })()}
      {step.screen === "more" && <MoreOrDone onMore={more} onDone={done} />}
      {step.screen === "R5" && <R5OwnWords onDone={finish} />}
      {step.screen === "R6" && (
        <R6Sent advice={step.advice} symptoms={draft.symptoms.map((s) => s.symptom)} labels={labels} />
      )}
    </>
  );
}
