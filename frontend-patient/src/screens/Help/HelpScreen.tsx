// Owner: person 2 — design port of app/help.html (artboard "12 · Who to call").
// Ranked cards: 112 (red), 116 117 (dark), Tell Nurse Aino (white → the report flow), and the
// "if you are not sure" footnote. The HUS Cancer Center is never listed as an urgent line.
import { Link } from "react-router-dom";

import { useI18n } from "../../i18n/LanguageProvider";
import { useReadable } from "../../voice/useReadable";

export function HelpScreen() {
  const { t } = useI18n();
  useReadable({
    heading: t("help.title"),
    priority: t("help.readPriority"),
  });
  return (
    <section className="help-screen">
      <div className="help-heading">
        <h1 className="help-title">{t("help.title")}</h1>
        <p className="help-sub">{t("help.sub")}</p>
      </div>

      <a className="help-call emergency" href="tel:112">
        <span className="help-call-title">{t("help.call112")}</span>
        <span className="help-call-sub">{t("help.sub112")}</span>
      </a>

      <a className="help-call urgent" href="tel:116117">
        <span className="help-call-title">{t("help.call116")}</span>
        <span className="help-call-sub">{t("help.sub116")}</span>
      </a>

      <Link className="help-call nurse" to="/report">
        <span className="help-call-title">{t("help.nurse")}</span>
        <span className="help-call-sub">{t("help.nurseSub")}</span>
      </Link>

      <p className="help-note">{t("help.note")}</p>
    </section>
  );
}
