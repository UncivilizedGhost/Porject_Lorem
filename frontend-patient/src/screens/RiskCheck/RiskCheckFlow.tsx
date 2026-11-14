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
import { useI18n } from "../../i18n/LanguageProvider";
import { setSession } from "../../lib/session";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";
import { questionsFor } from "./questions";

// TODO(demo): confirm the pilot's own sign-up address before the demo (see spec, Further Notes).
export const PILOT_SIGNUP_URL = "https://www.hus.fi/en";

type Answers = Record<string, string | number>;

export function RiskCheckFlow() {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [raw, setRaw] = useState("");
  const [consent, setConsent] = useState<boolean | null>(null);
  const [eligible, setEligible] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const questions = questionsFor(answers);
  const askingConsent = index >= questions.length;
  const question = questions[index];

  const submit = async (consentGiven: boolean, final: Answers) => {
    const { county, ...riskAnswers } = final;
    try {
      const created = await api.createContact({
        county,
        language,
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
    setAnswers(next);
    setRaw("");
    setIndex(index + 1);
  };
  const decide = (given: boolean) => {
    setConsent(given);
    void submit(given, answers);
  };

  const headline = eligible
    ? t("risk.eligibleTitle")
    : askingConsent
      ? t("risk.consentTitle")
      : question.prompt;
  const readable = useMemo(() => ({ heading: headline }), [headline]);
  useReadable(readable);
  const consentActions = useMemo(
    () =>
      askingConsent && !eligible
        ? [
            { id: "consent:yes", label: t("risk.yes"), synonyms: ["yes"], run: () => decide(true) },
            { id: "consent:no", label: t("risk.no"), synonyms: ["no"], run: () => decide(false) },
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
        <p>{t("risk.eligibleBody")}</p>
        <a className="primary" href={PILOT_SIGNUP_URL} target="_blank" rel="noreferrer">{t("risk.signup")}</a>
        <button type="button" onClick={() => navigate("/warning-signs")}>{t("risk.seeSigns")}</button>
      </section>
    );
  }

  if (askingConsent) {
    return (
      <section>
        <h1>{headline}</h1>
        <p>{t("risk.consentBody")}</p>
        {saveFailed ? (
          <>
            <p role="alert">{t("risk.saveFailed")}</p>
            <button type="button" className="primary" onClick={() => submit(consent ?? false, answers)}>{t("risk.retry")}</button>
          </>
        ) : (
          <>
            <button type="button" className="primary" onClick={() => decide(true)}>{t("risk.yes")}</button>
            <button type="button" onClick={() => decide(false)}>{t("risk.no")}</button>
          </>
        )}
      </section>
    );
  }

  const percent = Math.round(((index + 1) / questions.length) * 100);

  return (
    <section className="report-q">
      <div className="q-head">
        <span className="q-label">{t("risk.label")}</span>
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
              {t("common.next")}
            </button>
          </>
        )}
      </fieldset>
    </section>
  );
}
