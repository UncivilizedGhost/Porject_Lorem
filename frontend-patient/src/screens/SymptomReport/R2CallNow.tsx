// Owner: person 2 — design port of app/report-urgent.html (artboard "R2 · Call now").
// Names what triggered it, two full-width call buttons (112, 116 117), and the note that Nurse
// Aino was told too. The whole frame turns pale red while this screen is up.
import { useMemo } from "react";

import { useI18n } from "../../i18n/LanguageProvider";
import { useTonePage } from "../../shell/PageTone";
import { useReadable } from "../../voice/useReadable";

function WarningIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      <path d="M11 3l9 16H2z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M11 9v4.5M11 16v.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function R2CallNow({ reason }: { reason: string | null }) {
  const { t } = useI18n();
  useTonePage("alert");
  const readable = useMemo(
    () => ({
      heading: t("report.comeNow"),
      priority: `${t("report.comeNow")} ${reason ? t("report.callReason", { reason }) : ""}${t("help.readPriority")}`,
    }),
    [reason, t],
  );
  useReadable(readable);

  return (
    <section className="alert-page" role="alert">
      <span className="alert-icon"><WarningIcon /></span>
      <h1 className="alert-title">{t("report.comeNow")}</h1>
      <p className="alert-lead">
        {reason ? t("report.callReason", { reason }) : t("report.callVeryUnwell")}
        {t("report.callChecked")}
      </p>

      <div className="alert-calls">
        <a className="alert-button emergency" href="tel:112">
          {t("help.call112")}
          <span>{t("report.call112sub")}</span>
        </a>
        <a className="alert-button urgent" href="tel:116117">
          {t("help.call116")}
          <span>{t("report.call116sub")}</span>
        </a>
      </div>

      <p className="alert-lead">{t("report.orGo")}</p>
      <p className="alert-note">{t("report.toldAino")}</p>
    </section>
  );
}
