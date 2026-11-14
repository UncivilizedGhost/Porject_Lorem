// Owner: person 2 — design port of app/warning-signs.html (artboard "2 · Warning signs").
// Signs from GET /rules warning_signs as 116 px tiles; one tap sends POST /contacts/{id}/warning-sign-tap
// and the tile says what happens next. A red line about 112 is always visible.
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/client";
import type { Option } from "../../api/types";
import { useI18n } from "../../i18n/LanguageProvider";
import { actorFields, getSession } from "../../lib/session";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

type Outcome = { sign: string; grade: string } | null;

const ICONS: { test: RegExp; path: ReactNode }[] = [
  { test: /cough/i, path: <path d="M8 7c-3 2-4 5-4 8s2 7 6 7h1M22 7c3 2 4 5 4 8s-2 7-6 7h-1M15 4v11M15 15l-4 4M15 15l4 4" /> },
  { test: /voice|hoarse|throat/i, path: <path d="M15 4a4 4 0 014 4v6a4 4 0 01-8 0V8a4 4 0 014-4zM8 14a7 7 0 0014 0M15 21v5" /> },
  { test: /blood/i, path: <path d="M15 4c5 6 7 9 7 12a7 7 0 01-14 0c0-3 2-6 7-12z" /> },
  { test: /tired|fatigue|sleep/i, path: <path d="M20 6a9 9 0 100 18 10 10 0 01-6-9 10 10 0 016-9z" /> },
  { test: /appetite|eat|food|weight/i, path: <path d="M8 4v8a3 3 0 006 0V4M11 4v22M22 4c-3 2-4 6-4 10h4v12" /> },
];
const FALLBACK = <path d="M15 5a10 10 0 100 20 10 10 0 000-20zM15 15v.01" />;

function SignIcon({ label }: { label: string }) {
  const hit = ICONS.find((i) => i.test.test(label));
  return (
    <svg
      width="30" height="30" viewBox="0 0 30 30" focusable="false" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      {hit?.path ?? FALLBACK}
    </svg>
  );
}

function CheckRing({ on }: { on: boolean }) {
  return on ? (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M7 12.5l3.5 3.5 6.5-7" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
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
