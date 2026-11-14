// Owner: person 3 — .scratch/coordinator-worklist/spec.md (artboard "Coordinator worklist")
// One row: level chip and person, reason and delivery status, Pathway Clock with a progress bar,
// then the one-tap actions the server offers. Red is never colour alone: the chip carries a label.
import { useState } from "react";
import { Link } from "react-router-dom";

import type { WorklistRow as Row } from "../../api/types";
import { formatDecimal } from "../../lib/format";

export type RowAction =
  | "acknowledge"
  | "book_appointment"
  | "book_health_station_xray"
  | "escalate"
  | "flag_referral"
  | "mark_handled"
  | "mark_done"
  | "rebook"
  | "hand_to_trusted_person";

const BUTTONS: Record<RowAction, string> = {
  acknowledge: "Acknowledge",
  book_appointment: "Book appointment",
  book_health_station_xray: "Book health station and X-ray",
  escalate: "Escalate",
  flag_referral: "Flag referral",
  mark_handled: "Mark handled",
  mark_done: "Mark done",
  rebook: "Rebook",
  hand_to_trusted_person: "Hand to trusted person",
};

// The first offered action becomes the filled button; the rest sit beside it.
const PRIMARY_ORDER: RowAction[] = [
  "acknowledge",
  "book_health_station_xray",
  "mark_handled",
  "mark_done",
  "flag_referral",
  "rebook",
];

interface Props {
  row: Row;
  onAction: (row: Row, action: RowAction) => void | Promise<void>;
}

export function WorklistRow({ row, onAction }: Props) {
  const red = row.level === "red";
  const waiting = row.waiting_working_days;
  const clock = row.pathway_clock;
  const pct = clock ? Math.min(100, Math.max(0, (clock.day / clock.target_days) * 100)) : 0;
  const primary = PRIMARY_ORDER.find((a) => row.actions.includes(a)) ?? null;
  const others = (Object.keys(BUTTONS) as RowAction[]).filter(
    (a) => a !== primary && row.actions.includes(a),
  );
  const ladder =
    waiting !== null && waiting > 0
      ? `Waiting ${formatDecimal(waiting, 0)} working days (promise: 1–2)`
      : (clock?.next_deadline ?? "");
  const [busy, setBusy] = useState<RowAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (a: RowAction) => {
    setBusy(a);
    setError(null);
    try {
      await onAction(row, a);
    } catch (e) {
      setError(`${BUTTONS[a]} failed: ${e instanceof Error ? e.message : "try again"}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <li className="wl-row">
      <div className="wl-identity">
        {row.level && (
          <span className={`wl-chip wl-chip-${row.level}`}>{row.label ?? row.level}</span>
        )}
        <strong className="wl-name">{row.person.display_name}</strong>
      </div>

      <div className="wl-body">
        <p data-testid="reason" className="wl-reason">
          {row.reason}
        </p>
        {row.reported_by && (
          <span className="wl-subline">
            reported by {row.reported_by.name},{" "}
            {row.reported_by.actor === "trusted_person" ? "trusted person" : row.reported_by.actor}
          </span>
        )}
        {row.delivery_status.length > 0 && (
          <span className="wl-subline">{row.delivery_status.join(" · ")}</span>
        )}
        {red && row.acknowledged && <span className="wl-subline">Acknowledged</span>}
      </div>

      <div className="wl-clock">
        {clock ? (
          <>
            <span className="wl-clock-label">
              Day {clock.day} of {clock.target_days}
            </span>
            <div className="wl-track">
              <div className={`wl-fill wl-fill-${row.band}`} style={{ width: `${pct}%` }} />
            </div>
            {ladder && <span className="wl-ladder">{ladder}</span>}
          </>
        ) : (
          ladder && <span className="wl-ladder">{ladder}</span>
        )}
      </div>

      <div className="wl-actions">
        {primary && (
          <button
            type="button"
            className={`wl-btn wl-btn-primary ${busy === primary ? "wl-busy" : ""}`}
            disabled={busy !== null}
            aria-busy={busy === primary}
            onClick={() => run(primary)}
          >
            {busy === primary ? "Working…" : BUTTONS[primary]}
          </button>
        )}
        {row.actions.includes("call") &&
          (row.person.phone ? (
            <a className="wl-btn wl-btn-secondary" href={`tel:${row.person.phone.replace(/\s/g, "")}`}>
              Call {row.person.phone}
            </a>
          ) : (
            <span className="wl-btn wl-btn-secondary" aria-disabled="true">
              Call
            </span>
          ))}
        {others.map((a) =>
          a === "rebook" || a === "book_appointment" ? (
            <Link key={a} className="wl-btn wl-btn-link" to={`/worklist/book/${encodeURIComponent(row.row_id)}`}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
              {BUTTONS[a]}
            </Link>
          ) : (
            <button
              key={a}
              type="button"
              className={`wl-btn wl-btn-secondary ${busy === a ? "wl-busy" : ""}`}
              disabled={busy !== null}
              aria-busy={busy === a}
              onClick={() => run(a)}
            >
              {busy === a ? "Working…" : BUTTONS[a]}
            </button>
          ),
        )}
        {row.actions.includes("open_card") && row.detail_ref && (
          <Link className="wl-btn wl-btn-secondary" to={`/worklist/alerts/${row.detail_ref}`}>
            Open report card
          </Link>
        )}
      </div>

      {error && (
        <p role="alert" className="wl-error">
          {error}
        </p>
      )}
    </li>
  );
}
