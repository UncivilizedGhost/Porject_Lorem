// Owner: person 2 (patient app copy; person 1 has the provider-app twin).
// Thin dark strip on every screen: "Demo · day N" + "Advance one day" → POST /demo/advance-day,
// then dispatches window "demo-day-advanced" so the current screen refetches. Labelled demo-only.
// It also names the demo family: patient and caretaker in parentheses, from GET /demo/identities.
// "Trigger alarm" opens the Call now page (the port of app/report-urgent.html) and files a red
// symptom report, so the coordinator worklist gets the matching alert.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useI18n } from "../i18n/LanguageProvider";
import { actorFields, getSession } from "../lib/session";

type Names = { patient: string | null; caretaker: string | null };

export function DemoBar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [day, setDay] = useState<number | null>(null);
  const [names, setNames] = useState<Names>({ patient: null, caretaker: null });
  const [alarmFailed, setAlarmFailed] = useState(false);
  useEffect(() => {
    api.health().then((h) => setDay(h.current_demo_day)).catch(() => undefined);
    api.identities()
      .then((ids) => setNames({
        patient: ids.patient_name ?? null,
        caretaker: ids.trusted_person?.name ?? null,
      }))
      .catch(() => undefined);
  }, []);
  const advance = async () => {
    const r = await api.advanceDay();
    setDay(r.current_demo_day);
    window.dispatchEvent(new Event("demo-day-advanced"));
  };
  const alarm = async () => {
    setAlarmFailed(false);
    navigate("/alarm");
    try {
      const patientId = getSession()?.patientId ?? (await api.identities()).patient_id;
      if (!patientId) throw new Error("no patient");
      const rules = await api.rules();
      const ticked = rules.safety_check_items[0]?.id;
      if (!ticked) throw new Error("no safety check item");
      await api.symptomReport(patientId, {
        safety_check: { ticked: [ticked] },
        symptoms: [],
        own_words: { text: "Demo alarm raised from the demo bar.", source: "typed" },
        ...actorFields(),
      });
    } catch {
      setAlarmFailed(true);
    }
  };
  const who = names.patient || names.caretaker;
  return (
    <div className="demo-bar" role="status">
      <div className="demo-row">
        <span>{t("demo.badge", { day: day ?? "–" })}</span>
        <div className="demo-actions">
          <button type="button" onClick={advance}>{t("demo.advance")}</button>
          <button type="button" className="demo-alarm" onClick={alarm}>{t("demo.alarm")}</button>
        </div>
      </div>
      {(who || alarmFailed) && (
        <span className="demo-names">
          {names.patient && `${names.patient} (${t("demo.patient")})`}
          {names.patient && names.caretaker ? " · " : ""}
          {names.caretaker && `${names.caretaker} (${t("demo.caretaker")})`}
          {alarmFailed && <span className="demo-error" role="alert"> {t("demo.alarmFailed")}</span>}
        </span>
      )}
    </div>
  );
}
