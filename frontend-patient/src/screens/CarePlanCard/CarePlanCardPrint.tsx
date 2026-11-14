// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "Printable care-plan card")
// Print-stylesheet view of the next-step card: what / when / where, what to bring (Kela card),
// how to get there (HSL, Kela taxi), Nurse Aino + help numbers in spec order.
import { useMemo } from "react";

import { NURSE_PHONE } from "../../components/HelpNumbers";
import { useI18n } from "../../i18n/LanguageProvider";
import { formatClock, formatDate } from "../../lib/format";
import { usePatient } from "../../lib/usePatient";
import { NoPathwayYet } from "../../components/NoPathwayYet";
import { useReadable } from "../../voice/useReadable";
import "../../styles/print.css";

export function CarePlanCardPrint() {
  const patient = usePatient();
  const { t } = useI18n();
  const next = patient?.next_step ?? null;
  // Registers the card so Read-aloud can speak it; the text itself comes from <main>.
  useReadable(useMemo(() => ({ heading: t("card.title") }), [t]));
  if (patient === null) return <NoPathwayYet />;
  if (!patient) return <p>{t("common.loading")}</p>;
  return (
    <main className="care-plan-card">
      <h1>{t("card.title")}</h1>
      {next ? (
        <>
          <h2>{t("card.nextStep")}</h2>
          <p><strong>{next.what}</strong></p>
          <p>{formatDate(next.date)} at {formatClock(next.time)}</p>
          <p>{next.where}</p>
          <h2>{t("card.bring")}</h2>
          <ul>
            {next.what_to_bring.map((b) => <li key={b}>{b}</li>)}
          </ul>
          <h2>{t("card.howToGetThere")}</h2>
          <p>{t("card.howToGetThereBody")}</p>
        </>
      ) : (
        <p>{t("card.noNext")}</p>
      )}
      <h2>{t("help.title")}</h2>
      <ol>
        <li><strong>112</strong> {t("card.emergency")}</li>
        <li><strong>116 117</strong> {t("card.worse")}</li>
        <li><strong>{t("help.nurse")}</strong> {NURSE_PHONE}, {t("card.nurseLine")}</li>
      </ol>
      <button type="button" className="no-print" onClick={() => window.print()}>{t("card.print")}</button>
    </main>
  );
}
