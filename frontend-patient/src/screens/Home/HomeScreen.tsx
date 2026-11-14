// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "3 · Home (phase 2)")
// Ported from app/home.html: greeting, one status line, the next step with its single primary
// action, "Report a symptom" and "Call Nurse Aino" tiles, the weekly check-in row.
// No phase names and no day counter. From GET /patients/{id}. All app copy is translated.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { NURSE_PHONE } from "../../components/HelpNumbers";
import { NoPathwayYet } from "../../components/NoPathwayYet";
import { Icon } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import { formatClock, formatDate, formatWeekday } from "../../lib/format";
import { usePatient } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

export function HomeScreen() {
  const patient = usePatient();
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const next = patient?.next_step ?? null;
  const pending = next?.pending_confirmation ?? null;
  const name = patient?.display_name?.trim() ?? null;
  // The greeting uses the first name: "Good morning, Matti", not the whole record name.
  const firstName = name ? name.split(/\s+/)[0] : null;
  const when = next
    ? `${formatWeekday(next.date, language)} ${formatDate(next.date)} at ${formatClock(next.time)}`
    : "";

  // How many check-in questions there are; the artboard shows "4 of 10 answered", but answers
  // are not stored server-side, so only the total and the time are real.
  const [checkinTotal, setCheckinTotal] = useState<number>();
  useEffect(() => {
    let live = true;
    api.rules()
      .then((r) => { if (live) setCheckinTotal(r.checkin_items.length); })
      .catch(() => undefined);
    return () => { live = false; };
  }, []);

  const hour = new Date().getHours();
  const greeting = t(hour < 12 ? "home.morning" : hour < 18 ? "home.afternoon" : "home.evening");
  const hello = `${greeting}${firstName ? `, ${firstName}` : ""}`;
  const statusLine = patient
    ? t(patient.status === "on_track" ? "home.status.on_track" : "home.status.running_late")
    : "";

  const readable = useMemo(
    () => ({
      heading: hello,
      body: patient
        ? `${statusLine}.${next ? t("home.readableNext", { what: next.what, when, where: next.where }) : ""}`
        : "",
    }),
    [hello, patient, statusLine, next, when, t],
  );
  useReadable(readable);

  const actions = useMemo(
    () => [
      ...(pending
        ? [{
            id: "home:confirm",
            label: t("home.confirm"),
            synonyms: ["confirm"],
            confirm_text: `Confirm the ${next?.what} on ${when}?`,
            run: () => navigate(`/confirm/${pending.id}`),
          }]
        : []),
      { id: "home:report", label: t("home.reportTitle"), run: () => navigate("/report") },
      { id: "home:call", label: t("home.callTitle"), run: () => { window.location.href = `tel:${NURSE_PHONE}`; } },
      { id: "home:checkin", label: t("home.checkinTitle"), run: () => navigate("/check-in") },
    ],
    [pending, next, when, navigate, t],
  );
  useVoiceActions(actions);

  if (patient === null) return <NoPathwayYet />;
  if (!patient) return <p>{t("common.loading")}</p>;

  return (
    <section className="home">
      <div className="home-heading">
        <h1 className="home-greeting">{hello}</h1>
        <p className="status-line">
          <span
            className={`status-dot ${patient.status === "on_track" ? "status-ok" : ""}`}
            aria-hidden="true"
          />
          {statusLine}
        </p>
      </div>

      {next && (
        <div className="card next-step">
          <div className="next-facts">
            <p className="eyebrow">{t("home.nextStep")}</p>
            <h2 className="next-title">{next.what}</h2>
            <p className="next-when">{when}</p>
            <p className="next-where">{next.where}</p>
          </div>
          <Link className="text-link" to="/pathway">
            {t("home.howToGetThere")}
            <Icon name="chevron-right" size={20} />
          </Link>
          {pending && (
            <div className="confirm-block">
              <span className="chip chip-wait">{t("home.notConfirmed")}</span>
              <Link className="primary" to={`/confirm/${pending.id}`}>{t("home.confirm")}</Link>
            </div>
          )}
        </div>
      )}

      <div className="tile-grid">
        <Link className="tile" to="/report">
          <Icon name="report" size={30} />
          <span className="tile-text">
            <span className="tile-title">{t("home.reportTitle")}</span>
            <span className="tile-sub">{t("home.reportSub")}</span>
          </span>
        </Link>
        <a className="tile tile-apricot" href={`tel:${NURSE_PHONE}`}>
          <Icon name="phone" size={30} />
          <span className="tile-text">
            <span className="tile-title">{t("home.callTitle")}</span>
            <span className="tile-sub">{t("home.callSub")}</span>
          </span>
        </a>
      </div>

      <Link className="row-link" to="/check-in">
        <span>
          <span className="row-link-title">{t("home.checkinTitle")}</span>
          <span className="row-link-sub">
            {checkinTotal ? t("home.checkinSubCount", { n: checkinTotal }) : t("home.checkinSub")}
          </span>
        </span>
        <Icon name="chevron-right" size={20} />
      </Link>

      {/* Paper is an equal channel: a printable copy of the next step, opened in its own tab so
          the app stays where it is. */}
      <a className="row-link" href="/care-plan-card" target="_blank" rel="noreferrer">
        <span>
          <span className="row-link-title">{t("card.title")}</span>
          <span className="row-link-sub">{t("card.print")}</span>
        </span>
        <Icon name="chevron-right" size={20} />
      </a>
    </section>
  );
}
