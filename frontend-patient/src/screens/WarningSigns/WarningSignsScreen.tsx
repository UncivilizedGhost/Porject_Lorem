// Owner: person 2 — design port of app/warning-signs.html (artboard "2 · Warning signs").
// Signs from GET /rules warning_signs as 116 px tiles; tap to select/deselect any number,
// then Continue sends each selected symptom to POST /contacts/{id}/warning-sign-tap.
// A red line about 112 is always visible.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import type { Option } from "../../api/types";
import { Icon, type IconName } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import { actorFields, getSession } from "../../lib/session";
import { useReadable } from "../../voice/useReadable";

const SIGN_ICONS: { test: RegExp; name: IconName }[] = [
  { test: /cough/i, name: "sign-cough" },
  { test: /voice|hoarse|throat/i, name: "sign-voice" },
  { test: /blood/i, name: "sign-blood" },
  { test: /tired|fatigue|sleep/i, name: "sign-tired" },
  { test: /appetite|eat|food|weight/i, name: "sign-appetite" },
];

function SignIcon({ label }: { label: string }) {
  const hit = SIGN_ICONS.find((i) => i.test.test(label));
  return <Icon name={hit?.name ?? "sign-fallback"} size={30} />;
}

function CheckRing({ on }: { on: boolean }) {
  return <Icon name={on ? "check-circle" : "circle"} size={24} />;
}

export function WarningSignsScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [signs, setSigns] = useState<Option[]>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [outcomes, setOutcomes] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState(false);
  const contactId = getSession()?.contactId ?? "";

  useEffect(() => {
    api.rules().then((r) => setSigns(r.warning_signs)).catch(() => setError(true));
  }, []);

  const toggle = (signId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(signId)) next.delete(signId);
      else next.add(signId);
      return next;
    });
  };

  const submit = async () => {
    if (selected.size === 0) {
      navigate(getSession()?.role === "trusted_person" ? "/trusted" : "/home");
      return;
    }
    try {
      for (const signId of selected) {
        if (sent.has(signId)) continue;
        const sign = signs?.find((s) => s.id === signId);
        if (!sign) continue;
        const res = await api.warningSignTap(contactId, { symptom: sign.id, ...actorFields() });
        setOutcomes((prev) => new Map(prev).set(sign.id, res.grade));
        setSent((prev) => new Set(prev).add(sign.id));
      }
      setError(false);
    } catch {
      setError(true);
    }
  };

  const redDetected = [...outcomes.values()].includes("red");

  const readable = useMemo(
    () => ({
      heading: t("signs.title"),
      body: t("signs.body"),
      priority: redDetected ? t("signs.readPriority") : undefined,
    }),
    [outcomes, t, redDetected],
  );
  useReadable(readable);

  if (!signs) return error ? <p role="alert">{t("signs.loadError")}</p> : <p>{t("common.loading")}</p>;

  return (
    <section className="signs-page">
      <h1>{t("signs.title")}</h1>
      <p>{t("signs.body")}</p>

      <div className="signs">
        {signs.map((s) => {
          const isSelected = selected.has(s.id);
          const isSent = sent.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              className={`sign ${isSelected ? "selected" : ""} ${isSent ? "sent" : ""}`}
              data-sent={isSent}
              data-selected={isSelected}
              aria-pressed={isSelected}
              onClick={() => toggle(s.id)}
            >
              <span className="sign-icons">
                <span className="q-opt-icon"><SignIcon label={s.label} /></span>
                <span className="q-check"><CheckRing on={isSelected} /></span>
              </span>
              <span className="sign-label">{s.label}</span>
              {isSent && <span className="sign-sent">{t("signs.sent")}</span>}
            </button>
          );
        })}
      </div>

      {error && <p role="alert">{t("signs.error")}</p>}

      {redDetected && (
        <div className="callout-red" role="alert">
          <h2>{t("signs.redTitle")}</h2>
          <p>{t("signs.redBody")}</p>
          <a className="dark-button" href="tel:112">{t("help.call112")}</a>
          <a className="dark-button" href="tel:116117">{t("help.call116")}</a>
        </div>
      )}

      <button
        type="button"
        className="continue-button"
        onClick={submit}
      >
        {selected.size > 0 ? t("signs.submit") : t("signs.none")}
      </button>
    </section>
  );
}
