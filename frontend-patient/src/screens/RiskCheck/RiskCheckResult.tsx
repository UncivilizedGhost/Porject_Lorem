// Owner: person 2 — the end of the risk check. Assessment is based on the findings in
// data/lung_cancer_findings.md and the risk category requirements in data/risk_categories.md.
//
// Classification uses a weighted scoring model:
//   Age:             0-3 points (age 50 = 0, age 60 = 1, age 70 = 2, age 80+ = 3)
//   Current smoker:  +3
//   Ex-smoker:         +2
//   Cigarettes/day:  0-1 (cigarettesPerDay / 40)
//   Years smoked:    0-1 (yearsSmoked / 50)
//   Breathlessness:  +3
//   Frequent coughing: +2
//   Lung diagnosis (COPD, emphysema, bronchitis, TB): +3
//   Prior malignancy:  +3
//   Inhaled medication: +2
// Threshold: >= 4 for risk category B, < 4 for Category A.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Icon } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import { useReadable } from "../../voice/useReadable";

export type RiskCategory = "A" | "B";

export function classify(answers: Record<string, string | number>, _riskGroup: string | null): RiskCategory {
  let score = 0;

  const age = typeof answers.age === "number" ? answers.age : Number(answers.age) || 0;
  const currentSmoker = answers.current_smoker === "yes";
  const exSmoker = answers.ex_smoker === "yes";
  const cigarettesPerDay = typeof answers.cigarettes_per_day === "number" ? answers.cigarettes_per_day : Number(answers.cigarettes_per_day) || 0;
  const yearsSmoked = typeof answers.years_smoked === "number" ? answers.years_smoked : Number(answers.years_smoked) || 0;

  // Age: 0-3 points (age 50 = 0, age 60 = 1, age 70 = 2, age 80+ = 3)
  if (age >= 80) score += 3;
  else if (age >= 70) score += 2;
  else if (age >= 60) score += 2;
  else if (age >= 50) score += 1;

  // Smoking status
  if (currentSmoker) {
    score += 3;
  } else if (exSmoker) {
    score += 2;
  }

  // Smoking intensity: cigarettes per day and years smoked (0-1 each)
  if (currentSmoker || exSmoker) {
    score += Math.min(cigarettesPerDay / 40, 1);
    score += Math.min(yearsSmoked / 50, 1);
  }

  // Symptoms
  if (answers.breathlessness === "yes") score += 3;
  if (answers.frequent_coughing === "yes") score += 2;

  // Medical history
  if (answers.lung_diagnosis === "yes") score += 3;
  if (answers.malignancy === "yes") score += 3;
  if (answers.inhaled_medication === "yes") score += 2;

  // Threshold: >= 4 for risk category B
  if (score >= 4) return "B";
  return "A";
}

function RiskNone() {
  const { t } = useI18n();
  const readable = useMemo(
    () => ({ heading: t("risk.resultNoneTitle"), body: t("risk.resultNoneBody") }),
    [t],
  );
  useReadable(readable);

  return (
    <section className="help-screen">
      <span className="sent-check"><Icon name="check" size={38} /></span>
      <div className="help-heading">
        <h1 className="help-title">{t("risk.resultNoneTitle")}</h1>
        <p className="help-sub">{t("risk.resultNoneBody")}</p>
      </div>
      <p className="help-note">{t("risk.resultNoneNote")}</p>
      <Link className="sent-home" to="/home">{t("common.home")}</Link>
    </section>
  );
}

function RiskResult() {
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState(false);

  const readable = useMemo(
    () => ({ heading: t("risk.resultRiskTitle"), body: t("risk.resultRiskBody") }),
    [t],
  );
  useReadable(readable);

  if (submitted) {
    return (
      <section className="help-screen">
        <span className="sent-check"><Icon name="check" size={38} /></span>
        <div className="help-heading">
          <h1 className="help-title">{t("risk.appointmentSubmittedTitle")}</h1>
          <p className="help-sub">{t("risk.appointmentSubmittedBody")}</p>
        </div>
        <Link className="sent-home" to="/home">{t("common.home")}</Link>
      </section>
    );
  }

  return (
    <section className="help-screen">
      <span className="sent-check"><Icon name="warning" size={38} /></span>
      <div className="help-heading">
        <h1 className="help-title">{t("risk.resultRiskTitle")}</h1>
        <p className="help-sub">{t("risk.resultRiskBody")}</p>
      </div>
      <a className="help-call urgent" href="tel:116117">
        <span className="help-call-title">{t("help.call116")}</span>
        <span className="help-call-sub">{t("risk.resultRiskSub")}</span>
      </a>
      <div className="help-heading">
        <h2 className="help-title">{t("risk.appointmentTitle")}</h2>
        <p className="help-sub">{t("risk.appointmentBody")}</p>
      </div>
      <button type="button" className="primary" onClick={() => setSubmitted(true)}>
        {t("risk.appointmentYes")}
      </button>
      <Link className="sent-home" to="/home">Do not schedule an appointment</Link>
    </section>
  );
}

export function RiskCheckResult({
  riskGroup,
  answers,
}: {
  riskGroup: string | null;
  answers: Record<string, string | number>;
}) {
  const category = classify(answers, riskGroup);
  if (category === "B") return <RiskResult />;
  return <RiskNone />;
}