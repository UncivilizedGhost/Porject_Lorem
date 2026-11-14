// Owner: person 2 — design port of app/support-person.html (artboard "6 · Trusted-person view").
// GET /patients/{id}/trusted-view: appointments and pending confirmations only, never clinical
// content. The amber card is the appointment waiting for a confirmation; the two tiles are report
// and call. Everything the person does is recorded with their name.
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { NURSE_PHONE } from "../../components/HelpNumbers";
import { useI18n } from "../../i18n/LanguageProvider";
import { formatClock, formatDate, formatTime, formatWeekday } from "../../lib/format";
import { useTrustedView } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";

export function TrustedPersonView() {
  const view = useTrustedView();
  const { language, t } = useI18n();
  const readable = useMemo(
    () => ({ heading: t("trusted.title"), body: t("trusted.body") }),
    [t],
  );
  useReadable(readable);
  if (!view) return <p>{t("common.loading")}</p>;

  const next = view.next_step;
  const pending = next?.pending_confirmation ?? null;
  const appointment = view.appointments[0];
  const what = next?.what ?? appointment?.what;
  const when = next
    ? `${formatWeekday(next.date, language)} ${formatDate(next.date)} at ${formatClock(next.time)}`
    : appointment
      ? `${formatDate(appointment.at)} at ${formatTime(appointment.at)}`
      : "";
  const where = next?.where ?? appointment?.where ?? "";

  return (
    <section className="trusted">
      <h1>{t("trusted.title")}</h1>

      {what && (
        <div className="trusted-card">
          <span className="chip chip-wait">{pending ? t("trusted.pending") : t("trusted.confirmed")}</span>
          <span className="sent-title">{what}</span>
          <span className="path-meta">{when}{where ? ` · ${where}` : ""}</span>
          {pending && (
            <Link className="primary" to={`/confirm/${pending.id}`}>{t("trusted.confirm")}</Link>
          )}
          <p className="trusted-note">{t("trusted.note")}</p>
        </div>
      )}

      <div className="tile-grid">
        <Link className="tile" to="/report">
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6h18v18H6zM15 11v8M11 15h8" />
          </svg>
          <span className="tile-text">
            <span className="tile-title">{t("trusted.report")}</span>
            <span className="tile-sub">{t("trusted.reportSub")}</span>
          </span>
        </Link>
        <a className="tile tile-apricot" href={`tel:${NURSE_PHONE}`}>
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4h4l2 5-3 2a13 13 0 006 6l2-3 5 2v4a2 2 0 01-2 2A19 19 0 015 6a2 2 0 012-2z" />
          </svg>
          <span className="tile-text">
            <span className="tile-title">{t("home.callTitle")}</span>
            <span className="tile-sub">{t("trusted.callSub")}</span>
          </span>
        </a>
      </div>

      <p className="trusted-note">{t("trusted.privacy")}</p>
    </section>
  );
}
