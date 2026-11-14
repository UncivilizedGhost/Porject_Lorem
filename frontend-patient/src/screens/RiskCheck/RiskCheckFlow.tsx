// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "1 · Risk check (phase 0)")
// One question per screen (age, county, smoking, cigarettes/day, years), consent before the
// result, taps + NumberPad only → POST /contacts. Eligible → result with the pilot sign-up
// link; otherwise → /warning-signs.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { ChoiceList } from "../../components/ChoiceList";
import { NumberPad, parseNumber } from "../../components/NumberPad";
import { ProgressBar } from "../../components/ProgressBar";
import { setSession } from "../../lib/session";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";
import { questionsFor } from "./questions";

// TODO(demo): confirm the pilot's own sign-up address before the demo (see spec, Further Notes).
export const PILOT_SIGNUP_URL = "https://www.hus.fi/en";

type Answers = Record<string, string | number>;

export function RiskCheckFlow() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [raw, setRaw] = useState("");
  const [consent, setConsent] = useState<boolean | null>(null);
  const [eligible, setEligible] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const questions = questionsFor(answers.smoking_status as string | undefined);
  const askingConsent = index >= questions.length;
  const question = questions[index];

  const submit = async (consentGiven: boolean, final: Answers) => {
    const { county, ...riskAnswers } = final;
    try {
      const created = await api.createContact({
        county,
        language: "en",
        consent: { warning_sign_contact: consentGiven },
        risk_check: { taken: true, answers: riskAnswers },
      });
      setSession({ role: "patient", contactId: created._id });
      setSaveFailed(false);
      if (created.risk_group === "screening_pilot_eligible") setEligible(true);
      else navigate("/warning-signs");
    } catch {
      setSaveFailed(true);
    }
  };

  const answer = (id: string, value: string | number) => {
    const next = { ...answers, [id]: value };
    if (id === "smoking_status" && value !== "daily") {
      delete next.cigarettes_per_day;
      delete next.years_smoked;
    }
    setAnswers(next);
    setRaw("");
    setIndex(index + 1);
  };
  const decide = (given: boolean) => {
    setConsent(given);
    void submit(given, answers);
  };

  const headline = eligible
    ? "You may be able to join the lung cancer screening"
    : askingConsent
      ? "May a nurse contact you?"
      : question.prompt;
  const readable = useMemo(() => ({ heading: headline }), [headline]);
  useReadable(readable);
  const consentActions = useMemo(
    () =>
      askingConsent && !eligible
        ? [
            { id: "consent:yes", label: "Yes, a nurse may contact me", synonyms: ["yes"], run: () => decide(true) },
            { id: "consent:no", label: "No, do not contact me", synonyms: ["no"], run: () => decide(false) },
          ]
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [askingConsent, eligible, answers],
  );
  useVoiceActions(consentActions);

  if (eligible) {
    return (
      <section>
        <h1>{headline}</h1>
        <p>Based on your answers, you fit the national screening pilot. It is free, and you choose whether to join.</p>
        <a className="primary" href={PILOT_SIGNUP_URL} target="_blank" rel="noreferrer">Sign up for the screening</a>
        <button type="button" onClick={() => navigate("/warning-signs")}>See the signs to watch for</button>
      </section>
    );
  }

  if (askingConsent) {
    return (
      <section>
        <h1>{headline}</h1>
        <p>If you say yes, a nurse may call you about your result. You can say no and still see it.</p>
        {saveFailed ? (
          <>
            <p role="alert">We could not save your answers.</p>
            <button type="button" className="primary" onClick={() => submit(consent ?? false, answers)}>Try again</button>
          </>
        ) : (
          <>
            <button type="button" className="primary" onClick={() => decide(true)}>Yes, a nurse may contact me</button>
            <button type="button" onClick={() => decide(false)}>No, do not contact me</button>
          </>
        )}
      </section>
    );
  }

  const percent = Math.round(((index + 1) / questions.length) * 100);

  return (
    <section className="report-q">
      <div className="q-head">
        <span className="q-label">Screening check</span>
        <div className="q-progress">
          <span className="q-bar">
            <span className="q-bar-fill" style={{ width: `${percent}%` }} />
          </span>
          <span className="q-count">{index + 1} of {questions.length}</span>
        </div>
      </div>

      <ProgressBar step={index + 1} total={questions.length} />
      <fieldset className="q-field">
        <legend className="q-prompt">{question.prompt}</legend>
        {question.kind === "choice" ? (
          <ChoiceList
            choices={[...(question.options ?? [])]}
            onPick={(id) => answer(question.id, id)}
          />
        ) : (
          <>
            <NumberPad value={raw} onChange={setRaw} />
            <button type="button" className="q-next" disabled={raw === ""} onClick={() => answer(question.id, parseNumber(raw))}>
              Next
            </button>
          </>
        )}
      </fieldset>
    </section>
  );
}
