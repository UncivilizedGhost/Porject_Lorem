// Owner: person 3 — .scratch/coordinator-worklist/spec.md (artboard "Book appointment (from Worklist)")
// STRETCH. Appointment type first → clinicians → only days the clinician works and free slots
// → confirming books it and sends a simulated text message.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../../api/client";
import type { Availability, Clinician, WorklistRow } from "../../../api/types";
import { formatDate } from "../../../lib/format";
import { getSession } from "../../../lib/session";
import "../worklist.css";

const TYPES: [string, string][] = [
  ["xray_ct", "X-ray and low-dose CT"],
  ["chemotherapy", "Chemotherapy"],
  ["immunotherapy", "Immunotherapy"],
  ["radiotherapy", "Radiotherapy"],
  ["surgery_consultation", "Surgery consultation"],
  ["check_up", "Treatment and health-station check-up"],
];

const slotLabel = (s: string) => s.replace(/^0/, "").replace(":", ".");

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingScreen() {
  const { rowId = "" } = useParams();
  const [row, setRow] = useState<WorklistRow>();
  const [type, setType] = useState("");
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [clinician, setClinician] = useState<Clinician>();
  const [availability, setAvailability] = useState<Availability>();
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    api
      .worklist(getSession()?.coordinatorId ?? "")
      .then((w) => setRow(w.rows.find((r) => r.row_id === decodeURIComponent(rowId))))
      .catch(() => undefined);
  }, [rowId]);

  const pickType = async (t: string) => {
    setType(t);
    setClinician(undefined);
    setAvailability(undefined);
    setDay("");
    setSlot("");
    setClinicians(t ? await api.clinicians(t) : []);
  };

  const pickClinician = async (c: Clinician) => {
    setClinician(c);
    setDay("");
    setSlot("");
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 20);
    setAvailability(await api.availability(c.id, isoDate(from), isoDate(to)));
  };

  const confirm = async () => {
    if (!row || !clinician || !day || !slot) return;
    await api.book({
      subject_type: row.person.subject_type,
      subject_id: row.person.subject_id,
      clinician_id: clinician.id,
      type,
      start: `${day}T${slot}`,
    });
    setBooked(true);
  };

  const slots = availability?.days.find((d) => d.date === day)?.slots ?? [];

  return (
    <section className="booking">
      <p>
        <Link to="/worklist">← Worklist</Link>
      </p>
      <h1>Book appointment{row ? ` for ${row.person.display_name}` : ""}</h1>

      <label>
        Appointment type
        <select value={type} onChange={(e) => pickType(e.target.value)}>
          <option value="">Choose…</option>
          {TYPES.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {clinicians.length > 0 && (
        <div className="wl-actions">
          {clinicians.map((c) => (
            <button key={c.id} type="button" className="wl-btn" aria-pressed={clinician?.id === c.id} onClick={() => pickClinician(c)}>
              {c.name} · {c.location}
            </button>
          ))}
        </div>
      )}

      {availability && (
        <>
          <h2>Day</h2>
          <div className="wl-actions">
            {availability.days
              .filter((d) => d.slots.length > 0)
              .map((d) => (
                <button key={d.date} type="button" className="wl-btn" aria-pressed={day === d.date} onClick={() => { setDay(d.date); setSlot(""); }}>
                  {formatDate(`${d.date}T12:00:00`)}
                </button>
              ))}
          </div>
        </>
      )}

      {day && (
        <>
          <h2>Time</h2>
          <div className="wl-actions">
            {slots.map((s) => (
              <button key={s} type="button" className="wl-btn" aria-pressed={slot === s} onClick={() => setSlot(s)}>
                {slotLabel(s)}
              </button>
            ))}
          </div>
        </>
      )}

      <p>
        <button type="button" className="wl-btn" disabled={!row || !clinician || !day || !slot} onClick={confirm}>
          Confirm booking
        </button>
      </p>
      {booked && <p role="status">Booked. Text message sent (simulated).</p>}
    </section>
  );
}
