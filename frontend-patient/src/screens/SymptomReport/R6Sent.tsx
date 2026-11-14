// Owner: person 2 — design port of app/report-sent.html (artboard "R6 · Sent").
// The check mark, what was sent, the "getting worse" card with a way to the help numbers, and one
// big Home button. Green advice stays as a quiet card of its own.
import { useMemo } from "react";
import { Link } from "react-router-dom";

import type { AdviceShown } from "../../api/types";
import { Icon } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import type { MessageKey } from "../../i18n/dict";
import { getSession } from "../../lib/session";
import { useReadable } from "../../voice/useReadable";

const SELF_CARE: Record<string, MessageKey> = {
  breathlessness: "selfcare.breathlessness",
  cough: "selfcare.cough",
  pain: "selfcare.pain",
  fever_unwell: "selfcare.fever_unwell",
  tired_appetite: "selfcare.tired_appetite",
  other: "selfcare.other",
};

interface Props {
  advice: Exclude<AdviceShown, "call_now">;
  symptoms: string[];
  labels: Record<string, string>;
}

export function R6Sent({ advice, symptoms, labels }: Props) {
  const { t } = useI18n();
  const readable = useMemo(
    () => ({ heading: t("report.sentTitle"), body: t("report.sentBody") }),
    [t],
  );
  useReadable(readable);
  const names = symptoms.map((s) => labels[s] ?? s).join(", ");

  return (
    <section className="sent">
      <span className="sent-check"><Icon name="check" size={38} /></span>
      <h1>{t("report.sentTitle")}</h1>

      <div className="sent-card">
        <span className="sent-title">{names}</span>
        <span className="sent-sub">{t("report.sentBody")}</span>
      </div>

      {advice === "self_care" && (
        <div className="sent-card">
          <span className="sent-title">{t("report.meanwhile")}</span>
          <ul className="sent-list">
            {symptoms.map((s) => (
              <li key={s}>{t(SELF_CARE[s] ?? "selfcare.other")}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="sent-amber">
        <span className="sent-amber-title">{t("report.amber")}</span>
        <Link className="dark-button" to="/help">{t("report.whoToCall")}</Link>
      </div>

      <Link
        className="sent-home"
        to={getSession()?.role === "trusted_person" ? "/trusted" : "/home"}
      >
        {t("common.home")}
      </Link>
    </section>
  );
}
