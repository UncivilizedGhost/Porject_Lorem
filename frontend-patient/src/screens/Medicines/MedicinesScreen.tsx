// Owner: person 2 — design port of app/medication.html (artboard "8 · Medication").
// "Medicines today": one card per dose, generic labels only, no drug or brand names.
// I took it / I skipped it / Side effect each POST once to /patients/{id}/medication-log.
// Like the artboard, every dose is the same one-tap card: no slider, and once a dose is logged
// the card shows "Taken at 8.05" in place of the buttons.
// The logged choice lives here rather than in the card, so a poll or "Advance one day" (which
// briefly reloads the patient) cannot wipe what the person just tapped.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import type { Medicine } from "../../api/types";
import { useI18n } from "../../i18n/LanguageProvider";
import type { MessageKey } from "../../i18n/dict";
import { actorFields, getSession } from "../../lib/session";
import { usePatient } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

type Status = "taken" | "skipped" | "side_effect";
type Logged = { status: Status; at: string };
// Card memory only: what was tapped in this page view. Nothing is stored, so a reload shows the
// buttons again.

/** Where the dose sits in the day, from the generic label the server sends. The artboard shows a
 * clock time per card; the contract has no dose time, so the two dosed slots use the demo times
 * the artboard uses and an as-needed medicine shows none. */
function scheduleFor(medicine: Medicine): { lineKey: MessageKey; time: string | null } {
  const label = medicine.label.toLowerCase();
  if (label.includes("morning")) return { lineKey: "medicines.withBreakfast", time: "8.00" };
  if (label.includes("evening")) return { lineKey: "medicines.withDinner", time: "18.00" };
  return { lineKey: "medicines.whenNeeded", time: null };
}

function clockNow(): string {
  const d = new Date();
  return `${d.getHours()}.${String(d.getMinutes()).padStart(2, "0")}`;
}

/** The capsule from app/medication.html — the artboard has no image files, its art is inline SVG. */
function PillIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <path
        d="M5 17l9-9a5 5 0 017 7l-9 9a5 5 0 01-7-7zM10 12l7 7"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        d="M3.5 9.5l3.5 3.5 7.5-8"
        fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

const LOGGED: Record<Status, MessageKey> = {
  taken: "medicines.taken",
  skipped: "medicines.skipped",
  side_effect: "medicines.sideEffectNoted",
};

function MedicineCard({
  medicine,
  logged,
  failed,
  onLog,
}: {
  medicine: Medicine;
  logged?: Logged;
  failed: boolean;
  onLog: (id: string, s: Status) => Promise<boolean>;
}) {
  const schedule = scheduleFor(medicine);
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <li className="card medicine-card">
      <div className="med-head">
        <span className="med-icon"><PillIcon /></span>
        <span className="med-text">
          <span className="med-title">{medicine.label}</span>
          <span className="med-schedule">{t(schedule.lineKey)}</span>
        </span>
        {schedule.time && <span className="med-time">{schedule.time}</span>}
      </div>

      {logged ? (
        <p className="med-logged" data-status={logged.status} role="status">
          <CheckIcon />
          <span>
            {t("medicines.logged", { status: t(LOGGED[logged.status]), time: logged.at })}
          </span>
          <span className="sr-only">{t("common.saved")}</span>
        </p>
      ) : (
        <>
          <button type="button" className="primary med-primary" onClick={() => { void onLog(medicine.id, "taken"); }}>
            {t("medicines.took")}
          </button>
          <div className="med-actions">
            <button type="button" className="med-skip" onClick={() => { void onLog(medicine.id, "skipped"); }}>
              {t("medicines.iSkipped")}
            </button>
            {/* A side effect is logged and then hands over to the Symptom Report, which is
                where a nurse can act on it. */}
            <button
              type="button"
              onClick={() => {
                void onLog(medicine.id, "side_effect");
                navigate("/report");
              }}
            >
              {t("medicines.sideEffect")}
            </button>
          </div>
        </>
      )}

      {failed && <p className="error" role="alert">{t("medicines.failed")}</p>}
    </li>
  );
}

export function MedicinesScreen() {
  const patient = usePatient();
  const { t } = useI18n();
  const patientId = getSession()?.patientId ?? "";
  const [logged, setLogged] = useState<Record<string, Logged>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  // "Advance one day" starts a new day of doses: drop what was tapped in the previous day and let
  // the polling refetch the list (usePatient already re-runs on the same event).
  useEffect(() => {
    const refresh = () => {
      setLogged({});
      setFailed({});
    };
    window.addEventListener("demo-day-advanced", refresh);
    return () => window.removeEventListener("demo-day-advanced", refresh);
  }, []);

  const readable = useMemo(
    () => ({
      heading: t("medicines.title"),
      body: t("medicines.readBody"),
    }),
    [t],
  );
  useReadable(readable);

  const send = useMemo(
    () => async (medicine_id: string, status: Status) => {
      try {
        await api.medicationLog(patientId, { medicine_id, status, ...actorFields() });
        return true;
      } catch {
        return false;
      }
    },
    [patientId],
  );

  const log = useMemo(
    () => async (id: string, status: Status) => {
      const ok = await send(id, status);
      if (ok) setLogged((prev) => ({ ...prev, [id]: { status, at: clockNow() } }));
      setFailed((prev) => ({ ...prev, [id]: !ok }));
      return ok;
    },
    [send],
  );

  const actions = useMemo(
    () =>
      (patient?.medicines ?? []).flatMap((m) => [
        { id: `med:${m.id}:taken`, label: `${m.label}: I took it`, run: () => { void log(m.id, "taken"); } },
        { id: `med:${m.id}:skipped`, label: `${m.label}: I skipped it`, run: () => { void log(m.id, "skipped"); } },
        { id: `med:${m.id}:side_effect`, label: `${m.label}: side effect`, run: () => { void log(m.id, "side_effect"); } },
      ]),
    [patient, log],
  );
  useVoiceActions(actions);

  // Never send a Contact (no Patient yet) to the pathway screen from here: this page keeps its
  // own heading and simply has nothing to list.
  const medicines = patient?.medicines ?? [];

  return (
    <section className="medicines">
      <div className="screen-heading">
        <h1>{t("medicines.title")}</h1>
        <span className="screen-sub">{t("medicines.sub")}</span>
      </div>

      {patient === undefined ? (
        <p className="muted">{t("common.loading")}</p>
      ) : medicines.length === 0 ? (
        <p className="muted">{t("medicines.empty")}</p>
      ) : (
        <ul className="medicine-list">
          {medicines.map((m) => (
            <MedicineCard
              key={m.id}
              medicine={m}
              logged={logged[m.id]}
              failed={!!failed[m.id]}
              onLog={log}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
