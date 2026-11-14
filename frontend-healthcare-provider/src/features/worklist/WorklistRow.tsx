// Owner: person 3 — .scratch/coordinator-worklist/spec.md (artboard "Coordinator worklist")
// One row: reason, delivery status, Pathway Clock (Patients only), "reported by", the
// must-acknowledge control on red rows, and the one-tap actions the server offers for it.
import { useState } from "react";
import { Link } from "react-router-dom";

import type { WorklistRow as Row } from "../../api/types";
import { formatDate, formatTime } from "../../lib/format";

export type RowAction =
  | "acknowledge"
  | "book_health_station_xray"
  | "flag_referral"
  | "mark_handled"
  | "mark_done"
  | "rebook"
  | "hand_to_trusted_person";

const BUTTONS: Record<RowAction, string> = {
  acknowledge: "Acknowledge",
  book_health_station_xray: "Book health station and X-ray",
  flag_referral: "Flag referral",
  mark_handled: "Mark handled",
  mark_done: "Mark done",
  rebook: "Rebook",
  hand_to_trusted_person: "Hand to trusted person",
};

interface Props {
  row: Row;
  onAction: (row: Row, action: RowAction) => void | Promise<void>;
}

export function WorklistRow({ row, onAction }: Props) {
  const red = row.level === "red";
  const waiting = row.waiting_working_days;
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
    <li className={`wl-row wl-band-${row.band} ${red && !row.acknowledged ? "wl-must-ack" : ""}`}>
      <div className="wl-head">
        {row.level && <span className={`wl-level wl-${row.level}`}>{row.label ?? row.level}</span>}
        <strong>{row.person.display_name}</strong>
        <span className="wl-muted">
          {row.person.subject_type === "contact" ? "Contact" : "Patient"} · {row.person.county}
        </span>
        <span className="wl-muted wl-time">
          {formatDate(row.created_at)} {formatTime(row.created_at)}
        </span>
      </div>
      <p data-testid="reason" className="wl-reason">
        {row.reason}
      </p>
      {row.reported_by && (
        <p className="wl-muted">
          reported by {row.reported_by.name}, {row.reported_by.actor === "trusted_person" ? "trusted person" : row.reported_by.actor}
        </p>
      )}
      {row.delivery_status.length > 0 && <p className="wl-muted">{row.delivery_status.join(" · ")}</p>}
      {row.pathway_clock && (
        <p className="wl-muted">
          <span>
            Day {row.pathway_clock.day} of {row.pathway_clock.target_days}
          </span>
          {row.pathway_clock.next_deadline && <> · next deadline {row.pathway_clock.next_deadline}</>}
        </p>
      )}
      {waiting !== null && waiting > 0 && red === false && (
        <p className="wl-muted">Waiting {waiting} working days (promise: 1–2)</p>
      )}
      {red && row.acknowledged && <p className="wl-muted">Acknowledged</p>}
      <div className="wl-actions">
        {row.actions.includes("call") &&
          (row.person.phone ? (
            <a className="wl-btn" href={`tel:${row.person.phone.replace(/\s/g, "")}`}>
              Call {row.person.phone}
            </a>
          ) : (
            <span className="wl-btn" aria-disabled="true">Call</span>
          ))}
        {(Object.keys(BUTTONS) as RowAction[])
          .filter((a) => row.actions.includes(a))
          .map((a) => (
            <button
              key={a}
              type="button"
              className={`wl-btn ${busy === a ? "wl-busy" : ""}`}
              disabled={busy !== null}
              aria-busy={busy === a}
              onClick={() => run(a)}
            >
              {busy === a ? "Working…" : BUTTONS[a]}
            </button>
          ))}
        {row.actions.includes("open_card") && row.detail_ref && (
          <Link className="wl-btn" to={`/worklist/alerts/${row.detail_ref}`}>
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
