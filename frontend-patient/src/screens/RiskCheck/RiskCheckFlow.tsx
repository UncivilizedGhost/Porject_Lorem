// Owner: person 2 — the opt-in risk check — one question per screen, taps and
// a number pad only, consent before the result, taps + NumberPad only → POST /contacts.
// Result screen shows risk category assessment (A/B/C) based on answers.
// Eligible → pilot sign-up result; otherwise → risk result screen.
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { ChoiceList } from "../../components/ChoiceList";
import { Icon } from "../../components/Icon";
import { NumberPad, parseNumber } from "../../components/NumberPad";
import { useI18n } from "../../i18n/LanguageProvider";
import { setSession } from "../../lib/session";
import { classify } from "./RiskCheckResult";
import { questionsFor } from "./questions";
import { RiskCheckResult } from "./RiskCheckResult";

type Answers = Record<string, string | number>;

// Warning signs from GET /rules warning_signs, shown for acknowledgment before the result.
const WARNING_SIGNS: { id: string; label: string }[] = [
  { id: "worsening_cough", label: "A cough that is getting worse" },
  { id: "hoarseness", label: "Hoarseness for more than 3 weeks" },
  { id: "coughing_up_blood", label: "Coughing up blood" },
];

// Symptom questions for symptom checklist (last question before result).
const SYMPTOM_QUESTIONS: { id: string; label: string; weight: number }[] = [
  { id: "cough", label: "A cough that won't go away", weight: 2 },
  { id: "coughing_blood", label: "Coughing up blood", weight: 3 },
  { id: "breathlessness", label: "Shortness of breath", weight: 3 },
  { id: "chest_pain", label: "Chest pain", weight: 2 },
  { id: "hoarseness", label: "Hoarseness", weight: 1 },
  { id: "recurrent_infection", label: "Frequent lung infections", weight: 2 },
  { id: "weight_loss", label: "Unexplained weight loss", weight: 2 },
  { id: "fatigue", label: "Unexplained fatigue", weight: 1 },
];

export function RiskCheckFlow() {
  const { language, t } = useI18n();
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [raw, setRaw] = useState("");
  const [consent, setConsent] = useState<boolean | null>(null);
  const [riskGroup, setRiskGroup] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [warningSignsAcknowledged, setWarningSignsAcknowledged] = useState(false);

  const questions = questionsFor(answers);
  const askingConsent = index >= questions.length && warningSignsAcknowledged;
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
      setRiskGroup(created.risk_group);
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

  const showingWarnings = index >= questions.length && !warningSignsAcknowledged;

  const headline = askingConsent ? t("risk.consentTitle") : question?.prompt ?? "";

  if (showingWarnings) {
    return (
      <section className="help-screen">
        <span className="sent-check"><Icon name="warning" size={38} /></span>
        <div className="help-heading">
          <h1 className="help-title">{t("risk.warningSignsTitle")}</h1>
          <p className="help-sub">{t("risk.warningSignsBody")}</p>
        </div>
        <ul className="warning-signs-list">
          {WARNING_SIGNS.map((s) => (
            <li key={s.id}>{s.label}</li>
          ))}
        </ul>
        <p className="help-note">{t("risk.warningSignsNote")}</p>
        <button type="button" className="primary" onClick={() => setWarningSignsAcknowledged(true)}>
          {t("risk.warningSignsContinue")}
        </button>
      </section>
    );
  }

  if (riskGroup) return <RiskCheckResult riskGroup={riskGroup} answers={answers} />;

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

      <fieldset className="q-field">
        <legend className="q-prompt">{question!.prompt}</legend>
        {question.kind === "choice" ? (
          <ChoiceList choices={[...(question.options ?? [])]} onPick={(id) => answer(question.id, id)} />
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