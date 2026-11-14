// Owner: person 3 — Book appointment (from Worklist), linked from a row's Rebook.
// Type → doctor → only the doctor's working days and free times → confirming books it and sends
// a simulated text message. Every day and time shown comes from the server's availability.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../../api/client";
import type { Availability, Clinician, WorklistRow } from "../../../api/types";
import { formatDate } from "../../../lib/format";
import { getSession } from "../../../lib/session";
import "./booking.css";

const TYPE_GROUPS: { name: string; items: [string, string][] }[] = [
  { name: "Imaging", items: [["xray_ct", "X-ray and low-dose CT"]] },
  {
    name: "Treatments",
    items: [
      ["chemotherapy", "Chemotherapy"],
      ["immunotherapy", "Immunotherapy"],
      ["radiotherapy", "Radiotherapy"],
    ],
  },
  {
    name: "Consultations",
    items: [
      ["surgery_consultation", "Surgery consultation"],
      ["check_up", "Treatment and health-station check-up"],
    ],
  },
];
const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPE_GROUPS.flatMap((g) => g.items));

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HORIZON_DAYS = 60;

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const slotLabel = (s: string) => s.replace(/^0/, "").replace(":", ".");
const clockLabel = (h: string) => h.replace(/^0/, "").replace(":", ".");
const dayLabel = (iso: string) => formatDate(`${iso}T12:00:00`);

function daysLabel(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) return "Mon–Fri";
  if (sorted.length === 0) return "no working days";
  return sorted.map((d) => WEEKDAYS[d - 1]).join(", ");
}

function nextFree(availability: Availability | undefined): string {
  const first = availability?.days.find((d) => d.slots.length > 0);
  return first ? `${dayLabel(first.date)} ${slotLabel(first.slots[0])}` : "No free times in the next 8 weeks";
}

export function BookingScreen() {
  const { rowId = "" } = useParams();
  const [row, setRow] = useState<WorklistRow>();
  const [rowState, setRowState] = useState<"loading" | "ready" | "missing">("loading");
  const [type, setType] = useState("");
  const [doctors, setDoctors] = useState<Clinician[]>([]);
  const [clinician, setClinician] = useState<Clinician>();
  const [availability, setAvailability] = useState<Record<string, Availability>>({});
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [booked, setBooked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const pickSequence = useRef(0);

  useEffect(() => {
    let alive = true;
    api
      .worklist(getSession()?.coordinatorId ?? "")
      .then((w) => {
        if (!alive) return;
        const found = w.rows.find((r) => r.row_id === decodeURIComponent(rowId));
        setRow(found);
        setRowState(found ? "ready" : "missing");
      })
      .catch(() => {
        if (alive) setRowState("missing");
      });
    return () => {
      alive = false;
    };
  }, [rowId]);

  const current = clinician ? availability[clinician.id] : undefined;
  const times = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of current?.days ?? []) map.set(d.date, d.slots);
    return map;
  }, [current]);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastMonth = startOfMonth(addDays(today, HORIZON_DAYS));

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const leading = (new Date(year, month, 1).getDay() + 6) % 7; // Monday first
    const count = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: count }, (_, i) => new Date(year, month, i + 1)),
    ];
  }, [viewMonth]);

  const daySlots = day ? (times.get(day) ?? []) : [];
  const canBook = Boolean(row && type && clinician && day && slot);

  async function loadAvailability(doctorsToLoad: Clinician[], mine: number) {
    const from = new Date();
    const to = addDays(from, HORIZON_DAYS);
    const entries = await Promise.all(
      doctorsToLoad.map(async (c) => {
        try {
          return [c.id, await api.availability(c.id, isoDate(from), isoDate(to))] as const;
        } catch {
          return [c.id, undefined] as const;
        }
      }),
    );
    if (mine !== pickSequence.current) return;
    const loaded: Record<string, Availability> = {};
    for (const [id, a] of entries) if (a) loaded[id] = a;
    setAvailability(loaded);
    setLoadingTimes(false);
  }

  const pickType = async (next: string) => {
    const mine = ++pickSequence.current;
    setType(next);
    setDoctors([]);
    setClinician(undefined);
    setAvailability({});
    setDay("");
    setSlot("");
    setBooked(false);
    setError(undefined);
    setViewMonth(startOfMonth(new Date()));
    setLoadingDoctors(true);
    setLoadingTimes(false);

    try {
      const list = await api.clinicians(next);
      if (mine !== pickSequence.current) return;
      setDoctors(list);
      setLoadingDoctors(false);
      if (list.length > 0) {
        setLoadingTimes(true);
        await loadAvailability(list, mine);
      }
    } catch {
      if (mine !== pickSequence.current) return;
      setLoadingDoctors(false);
      setError("Could not load the doctors for this appointment type.");
    }
  };

  const pickClinician = async (c: Clinician) => {
    setClinician(c);
    setDay("");
    setSlot("");
    setError(undefined);
    if (availability[c.id]) return;

    const from = new Date();
    setLoadingTimes(true);
    try {
      const a = await api.availability(c.id, isoDate(from), isoDate(addDays(from, HORIZON_DAYS)));
      setAvailability((prev) => ({ ...prev, [c.id]: a }));
    } catch {
      setError("Could not load the free times for this doctor.");
    } finally {
      setLoadingTimes(false);
    }
  };

  const confirm = async () => {
    if (!row || !clinician || !day || !slot) return;
    setBusy(true);
    setError(undefined);
    try {
      await api.book({
        subject_type: row.person.subject_type,
        subject_id: row.person.subject_id,
        clinician_id: clinician.id,
        type,
        start: `${day}T${slot}`,
      });
      setBooked(true);
    } catch {
      setError("That time could not be booked — it may just have been taken. Pick another slot.");
      setSlot("");
      const from = new Date();
      try {
        const a = await api.availability(clinician.id, isoDate(from), isoDate(addDays(from, HORIZON_DAYS)));
        setAvailability((prev) => ({ ...prev, [clinician.id]: a }));
      } catch {
        // The slot list stays as it was; the user can reload the page for fresh times.
      }
    } finally {
      setBusy(false);
    }
  };

  const bookAnother = () => {
    pickSequence.current += 1;
    setType("");
    setDoctors([]);
    setClinician(undefined);
    setAvailability({});
    setDay("");
    setSlot("");
    setBooked(false);
    setError(undefined);
    setLoadingDoctors(false);
    setLoadingTimes(false);
    setViewMonth(startOfMonth(new Date()));
  };

  if (rowState === "missing") {
    return (
      <div className="bk-page">
        <Link className="bk-back" to="/worklist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to worklist
        </Link>
        <section className="bk-card">
          <h1 className="bk-missing-title">Book an appointment</h1>
          <p className="bk-note">This worklist row is no longer open, so there is no one to book for.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="bk-page">
      <Link className="bk-back" to="/worklist">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to worklist
      </Link>

      <header className="bk-header">
        <div className="bk-header-text">
          <h1>Book an appointment</h1>
          <span className="bk-sub">
            Nurse Aino · Western Uusimaa · only free times inside the doctor's working hours can be picked
          </span>
        </div>
        <span className="bk-badge">Synthetic doctors and bookings</span>
      </header>

      <div className="bk-layout">
        <div className="bk-main">
          <section className="bk-card" aria-labelledby="bk-patient-heading">
            <h2 id="bk-patient-heading">1 · Patient</h2>
            <div className="bk-patient">
              {rowState === "loading" ? (
                <span>Loading…</span>
              ) : (
                <>
                  <strong>{row?.person.display_name}</strong>
                  <span>
                    {row?.person.county} · from the worklist row
                  </span>
                </>
              )}
            </div>
          </section>

          <section className="bk-card" aria-labelledby="bk-type-heading">
            <h2 id="bk-type-heading">2 · Appointment type</h2>
            <div className="bk-groups">
              {TYPE_GROUPS.map((group) => (
                <div key={group.name} className="bk-group" role="group" aria-label={group.name}>
                  <span className="bk-group-name">{group.name}</span>
                  <div className="bk-chips">
                    {group.items.map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className="bk-chip"
                        aria-pressed={type === id}
                        onClick={() => void pickType(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bk-card" aria-labelledby="bk-doctor-heading">
            <div className="bk-card-head">
              <h2 id="bk-doctor-heading">3 · Doctor</h2>
              <span className="bk-card-meta">
                {type
                  ? loadingDoctors
                    ? "Looking for doctors…"
                    : `${doctors.length} conducting ${TYPE_LABEL[type]}`
                  : "Pick a type first"}
              </span>
            </div>
            {type && !loadingDoctors && doctors.length === 0 ? (
              <p className="bk-note">No doctors offer this appointment type.</p>
            ) : type ? (
              <div className="bk-clinicians">
                {doctors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="bk-clinician"
                    aria-pressed={clinician?.id === c.id}
                    onClick={() => void pickClinician(c)}
                  >
                    <span className="bk-clinician-name">{c.name}</span>
                    <span className="bk-clinician-role">{c.location}</span>
                    <span className="bk-clinician-works">
                      Works {daysLabel(c.working_days)} {clockLabel(c.hours.start)}–{clockLabel(c.hours.end)}
                    </span>
                    <span className="bk-clinician-next">
                      {loadingTimes && !availability[c.id]
                        ? "Checking free times…"
                        : `Next free: ${nextFree(availability[c.id])}`}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="bk-note">Choose an appointment type to see who can take it.</p>
            )}
          </section>

          <section className="bk-card" aria-labelledby="bk-time-heading">
            <div className="bk-card-head">
              <h2 id="bk-time-heading">4 · Day and time</h2>
              {clinician && (
                <div className="bk-month-nav">
                  <button
                    type="button"
                    className="bk-month-btn"
                    aria-label="Previous month"
                    disabled={viewMonth <= startOfMonth(today)}
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <span className="bk-month-label" aria-live="polite">
                    {viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    type="button"
                    className="bk-month-btn"
                    aria-label="Next month"
                    disabled={viewMonth >= lastMonth}
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="bk-legend" aria-label="Calendar key">
              <span className="bk-legend-item">
                <span className="bk-swatch" aria-hidden="true" />
                Free times
              </span>
              <span className="bk-legend-item">
                <span className="bk-swatch bk-swatch-selected" aria-hidden="true" />
                Selected
              </span>
              <span className="bk-legend-item">
                <span className="bk-swatch bk-swatch-off" aria-hidden="true" />
                Not working, full or past
              </span>
            </div>

            <div className="bk-cal-scroll">
              <div className="bk-cal">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="bk-weekday">
                    {w}
                  </span>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <div key={`blank-${i}`} aria-hidden="true" />;
                  const iso = isoDate(d);
                  const free = times.get(iso) ?? [];
                  const known = times.has(iso);
                  const past = d < todayStart;
                  const open = Boolean(clinician) && !past && known && free.length > 0;
                  const sub = !clinician
                    ? ""
                    : loadingTimes
                      ? "…"
                      : past
                        ? "Past"
                        : !known
                          ? "Closed"
                          : free.length === 0
                            ? "Full"
                            : `${free.length} free`;
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`bk-day ${open ? "bk-day-open" : ""}`}
                      disabled={!open}
                      aria-pressed={day === iso}
                      aria-label={`${dayLabel(iso)}${sub ? ` · ${sub}` : ""}`}
                      onClick={() => {
                        setDay(iso);
                        setSlot("");
                      }}
                    >
                      <span className="bk-day-num">{d.getDate()}</span>
                      {sub && <span className="bk-day-sub">{sub}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bk-day-detail">
              {!clinician ? (
                <p className="bk-note">Pick a doctor to see their working days and free times.</p>
              ) : loadingTimes ? (
                <p className="bk-note">Loading free times…</p>
              ) : !day ? (
                <p className="bk-note">Pick a day above to see the free times.</p>
              ) : (
                <>
                  <span className="bk-day-title">
                    {WEEKDAY_LONG[new Date(`${day}T12:00:00`).getDay()]} {dayLabel(day)}
                  </span>
                  <span className="bk-note">
                    {daySlots.length} free {daySlots.length === 1 ? "time" : "times"} · {clinician.slot_minutes} min
                  </span>
                  <div className="bk-slots">
                    {daySlots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="bk-slot"
                        aria-pressed={slot === s}
                        aria-label={`${slotLabel(s)} · ${clinician.slot_minutes} min`}
                        onClick={() => setSlot(s)}
                      >
                        <span className="bk-slot-time">{slotLabel(s)}</span>
                        <span className="bk-slot-sub">{clinician.slot_minutes} min</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <aside className="bk-summary" aria-label="Booking summary">
          <h2>Summary</h2>
          <dl>
            <dt>Patient</dt>
            <dd>{row?.person.display_name ?? "…"}</dd>
            <dt>Type</dt>
            <dd>{TYPE_LABEL[type] ?? "—"}</dd>
            <dt>Doctor</dt>
            <dd>{clinician?.name ?? "—"}</dd>
            <dt>Place</dt>
            <dd>{clinician?.location ?? "—"}</dd>
            <dt>When</dt>
            <dd className={day && slot ? "bk-when" : undefined}>
              {day && slot ? `${dayLabel(day)} at ${slotLabel(slot)}` : "Not chosen"}
            </dd>
            <dt>Length</dt>
            <dd>{clinician ? `${clinician.slot_minutes} min` : "—"}</dd>
          </dl>

          {!booked ? (
            <>
              <p className="bk-sms">
                <span className="bk-sms-check" aria-hidden="true">
                  ✓
                </span>
                Send SMS confirmation to patient (simulated)
              </p>
              <p className="bk-sms-note">Sent automatically when you confirm.</p>
              <button type="button" className="bk-confirm" disabled={!canBook || busy} onClick={() => void confirm()}>
                {busy ? "Booking…" : "Confirm booking"}
              </button>
              {error && (
                <p className="bk-error" role="alert">
                  {error}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="bk-done" role="status">
                <strong>Booked</strong>
                <span>
                  {row?.person.display_name} · {TYPE_LABEL[type]} with {clinician?.name} on {dayLabel(day)} at{" "}
                  {slotLabel(slot)}, {clinician?.location}. Text message sent (simulated).
                </span>
              </div>
              <button type="button" className="bk-secondary" onClick={bookAnother}>
                Book another
              </button>
              <Link className="bk-primary-link" to="/worklist">
                Back to worklist
              </Link>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
