// Owner: person 2 — the end of the check-in. call_now → the red Call now screen; otherwise the
// thank-you wears the Who to call layout (help.html) so the numbers are one tap away from the
// result: 112 (red), 116 117 (dark), Tell Nurse Aino (white), then Home.
import { useMemo } from "react";
import { Link } from "react-router-dom";

import type { AdviceShown } from "../../api/types";
import { Icon } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import { useReadable } from "../../voice/useReadable";
import { R2CallNow } from "../SymptomReport/R2CallNow";

function Thanks() {
  const { t } = useI18n();
  const readable = useMemo(
    () => ({ heading: t("checkin.thanksTitle"), body: t("checkin.thanksBody") }),
    [t],
  );
  useReadable(readable);

  return (
    <section className="help-screen">
      <span className="sent-check"><Icon name="check" size={38} /></span>

      <div className="help-heading">
        <h1 className="help-title">{t("checkin.thanksTitle")}</h1>
        <p className="help-sub">{t("checkin.thanksBody")}</p>
      </div>

      <a className="help-call emergency" href="tel:112">
        <span className="help-call-title">{t("help.call112")}</span>
        <span className="help-call-sub">{t("help.sub112")}</span>
      </a>

      <a className="help-call urgent" href="tel:116117">
        <span className="help-call-title">{t("help.call116")}</span>
        <span className="help-call-sub">{t("checkin.worse")}</span>
      </a>

      <Link className="help-call nurse" to="/report">
        <span className="help-call-title">{t("help.nurse")}</span>
        <span className="help-call-sub">{t("help.nurseSub")}</span>
      </Link>

      <p className="help-note">{t("checkin.thanksNote")}</p>

      <Link className="sent-home" to="/home">{t("common.home")}</Link>
    </section>
  );
}

export function CheckInResult({ advice }: { advice: AdviceShown }) {
  return advice === "call_now" ? <R2CallNow reason={null} /> : <Thanks />;
}
