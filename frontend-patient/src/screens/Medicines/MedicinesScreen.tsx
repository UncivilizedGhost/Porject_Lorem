// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "8 · Medication")
// Generic labels, no drug names; taken / skipped / side effect one tap →
// POST /patients/{id}/medication-log. A time-critical medicine uses the alarm-style slider.
import { useMemo, useState } from "react";

import { api } from "../../api/client";
import type { Medicine } from "../../api/types";
import { SlideToConfirm } from "../../components/SlideToConfirm";
import { actorFields, getSession } from "../../lib/session";
import { usePatient } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

type Status = "taken" | "skipped" | "side_effect";

function MedicineRow({ medicine, onLog }: { medicine: Medicine; onLog: (id: string, s: Status) => Promise<boolean> }) {
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const log = async (status: Status) => {
    const ok = await onLog(medicine.id, status);
    setSaved(ok);
    setFailed(!ok);
  };
  return (
    <li className="card">
      <p><strong>{medicine.label}</strong></p>
      {medicine.time_critical ? (
        <SlideToConfirm label={`${medicine.label} taken`} onConfirm={() => log("taken")} />
      ) : (
        <button type="button" className="primary" onClick={() => log("taken")}>Taken</button>
      )}
      <button type="button" onClick={() => log("skipped")}>Skipped</button>
      <button type="button" onClick={() => log("side_effect")}>Side effect</button>
      {saved && <p role="status">Saved</p>}
      {failed && <p role="alert">Could not save. Please try again.</p>}
    </li>
  );
}

export function MedicinesScreen() {
  const patient = usePatient();
  const patientId = getSession()?.patientId ?? "";
  const readable = useMemo(
    () => ({ heading: "Your medicines", body: "Tap Taken, Skipped or Side effect for each one." }),
    [],
  );
  useReadable(readable);
  const log = useMemo(
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
  const actions = useMemo(
    () =>
      (patient?.medicines ?? []).flatMap((m) => [
        { id: `med:${m.id}:taken`, label: `${m.label} taken`, run: () => { void log(m.id, "taken"); } },
        { id: `med:${m.id}:skipped`, label: `${m.label} skipped`, run: () => { void log(m.id, "skipped"); } },
      ]),
    [patient, log],
  );
  useVoiceActions(actions);

  if (!patient) return <p>Loading…</p>;
  return (
    <section>
      <h1>Your medicines</h1>
      <p className="source-chip">From Kanta (FHIR mock-up)</p>
      <ul className="medicine-list">
        {patient.medicines.map((m) => (
          <MedicineRow key={m.id} medicine={m} onLog={log} />
        ))}
      </ul>
    </section>
  );
}
