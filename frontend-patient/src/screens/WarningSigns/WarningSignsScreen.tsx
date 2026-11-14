// Owner: person 2 — design port of app/warning-signs.html (artboard "2 · Warning signs").
// Signs from GET /rules warning_signs as 116 px tiles; one tap sends POST /contacts/{id}/warning-sign-tap
// and the tile says what happens next. A red line about 112 is always visible.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/client";
import type { Option } from "../../api/types";
import { Icon, type IconName } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import { actorFields, getSession } from "../../lib/session";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

type Outcome = { sign: string; grade: string } | null;

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
  const [signs, setSigns] = useState<Option[]>();
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [error, setError] = useState(false);
  const contactId = getSession()?.contactId ?? "";

  useEffect(() => {
    api.rules().then((r) => setSigns(r.warning_signs)).catch(() => setError(true));
  }, []);

  const tap = useMemo(
    () => async (sign: Option) => {
      try {
        const res = await api.warningSignTap(contactId, { symptom: sign.id, ...actorFields() });
        setError(false);
        setOutcome({ sign: sign.id, grade: res.grade });
      } catch {
        setError(true);
      }
    },
    [contactId],
  );

  const readable = useMemo(
    () => ({
      heading: t("signs.title"),
      body: t("signs.body"),
      priority: outcome?.grade === "red" ? t("signs.readPriority") : undefined,
    }),
    [outcome, t],
  );
  useReadable(readable);
  const actions = useMemo(
    () => (signs ?? []).map((s) => ({ id: `sign:${s.id}`, label: `I have this: ${s.label}`, run: () => tap(s) })),
    [signs, tap],
  );
  useVoiceActions(actions);

  if (!signs) return error ? <p role="alert">{t("signs.loadError")}</p> : <p>{t("common.loading")}</p>;

  return (
    <section className="signs-page">
      <h1>{t("signs.title")}</h1>

      <div className="signs">
        {signs.map((s) => {
          const sent = outcome?.sign === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className="sign"
              data-sent={sent}
              onClick={() => tap(s)}
            >
              <span className="sign-icons">
                <span className="q-opt-icon"><SignIcon label={s.label} /></span>
                <span className="q-check"><CheckRing on={sent} /></span>
              </span>
              <span className="sign-label">{s.label}</span>
              {sent && <span className="sign-sent">{t("signs.sent")}</span>}
            </button>
          );
        })}
      </div>

      {error && <p role="alert">{t("signs.error")}</p>}

      {outcome?.grade === "red" && (
        <div className="callout-red" role="alert">
          <h2>{t("signs.redTitle")}</h2>
          <p>{t("signs.redBody")}</p>
          <a className="dark-button" href="tel:112">{t("help.call112")}</a>
          <a className="dark-button" href="tel:116117">{t("help.call116")}</a>
        </div>
      )}

      <p className="signs-note">{t("signs.note")}</p>

      <Link
        className="continue-button"
        to={getSession()?.role === "trusted_person" ? "/trusted" : "/home"}
      >
        {t("signs.continue")}
      </Link>
    </section>
  );
}
