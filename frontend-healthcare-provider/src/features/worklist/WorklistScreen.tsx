// Owner: person 3 — .scratch/coordinator-worklist/spec.md (artboard "Coordinator worklist")
// Polls GET /worklist every 4 s; rows in band order (red Alerts, call-backs, overdue
// Confirmations, yellow/green), oldest first within a band; completion bar; Work done section.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import type { WorklistDoneRow, WorklistRow as Row } from "../../api/types";
import { formatDate, formatTime } from "../../lib/format";
import { getSession } from "../../lib/session";
import { usePolling } from "../../lib/usePolling";
import { SyntheticBadge } from "../dashboard/components/SyntheticBadge";
import { type RowAction, WorklistRow } from "./WorklistRow";
import "./worklist.css";

type Tab = "all" | "alert" | "callback" | "escalation";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "alert", label: "Alerts" },
  { key: "callback", label: "Call-backs" },
  { key: "escalation", label: "Escalations" },
];

export function WorklistScreen() {
  const coordinatorId = getSession()?.coordinatorId ?? "";
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<Tab>("all");
  const navigate = useNavigate();
  const fetcher = useCallback(() => api.worklist(coordinatorId), [coordinatorId, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const data = usePolling(fetcher, 4000);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [undoError, setUndoError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setUpdatedAt(Date.now());
    setSecondsAgo(0);
  }, [data]);

  useEffect(() => {
    if (updatedAt === null) return;
    const id = setInterval(
      () => setSecondsAgo(Math.floor((Date.now() - updatedAt) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [updatedAt]);

  const act = async (row: Row, action: RowAction) => {
    const id = row.detail_ref ?? "";
    switch (action) {
      case "acknowledge":
        await api.acknowledge(id, coordinatorId);
        break;
      case "flag_referral":
        await api.promote(row.person.subject_id);
        break;
      case "book_health_station_xray":
        await api.callbackHandled(row.person.subject_id, "booked");
        break;
      case "mark_done":
        await api.alertAction(id, { action: "mark_done" });
        break;
      case "mark_handled":
        if (row.kind === "callback") await api.callbackHandled(row.person.subject_id);
        else if (row.kind === "escalation") await api.stepHandled(id);
        else await api.alertAction(id, { action: "mark_done" });
        break;
      case "hand_to_trusted_person":
        await api.stepHandled(id, "handed_to_trusted_person");
        break;
      case "rebook":
        navigate(`/worklist/book/${encodeURIComponent(row.row_id)}`);
        return;
    }
    setVersion((v) => v + 1);
  };

  const undo = async (d: WorklistDoneRow) => {
    if (!d.detail_ref) return;
    setUndoing(d.row_id);
    setUndoError(null);
    try {
      if (d.kind === "alert") await api.reopenAlert(d.detail_ref);
      else if (d.kind === "escalation") await api.reopenStep(d.detail_ref);
      setVersion((v) => v + 1);
    } catch {
      setUndoError(`Could not undo ${d.person.display_name}'s row. Try again.`);
    } finally {
      setUndoing(null);
    }
  };

  const rows = [...(data?.rows ?? [])].sort(
    (a, b) => a.band - b.band || a.created_at.localeCompare(b.created_at),
  );
  const done = data?.done ?? [];
  const doneCount = data?.workload.done_count ?? done.length;
  const total = rows.length + doneCount;
  const pct = data?.workload.pct_done ?? (total ? Math.round((doneCount / total) * 100) : 0);
  const counts: Record<Tab, number> = {
    all: rows.length,
    alert: rows.filter((r) => r.kind === "alert").length,
    callback: rows.filter((r) => r.kind === "callback").length,
    escalation: rows.filter((r) => r.kind === "escalation").length,
  };
  const visible = tab === "all" ? rows : rows.filter((r) => r.kind === tab);

  return (
    <section className="worklist-page">
      <div className="wl-header">
        <div className="wl-header-text">
          <h1>Coordinator worklist</h1>
          <span className="wl-sub">
            Nurse Aino · Western Uusimaa
            {updatedAt !== null && ` · updated ${secondsAgo} second${secondsAgo === 1 ? "" : "s"} ago`}
          </span>
        </div>
        {data && (
          <div className="wl-stats">
            <span>
              <strong>{rows.length}</strong> need action
            </span>
            <span>
              <strong>{data.workload.alerts_today}</strong> alerts today
            </span>
            <SyntheticBadge />
          </div>
        )}
      </div>

      {data && (
        <div className="wl-progress">
          <div className="wl-progress-head">
            <span>Worklist progress</span>
            <span>
              {doneCount} of {total} done · {pct} %
            </span>
          </div>
          <div
            className="wl-progress-track"
            role="progressbar"
            aria-label="Worklist progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div className="wl-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="wl-tabs" role="group" aria-label="Filter worklist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className="wl-tab-count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {data && visible.length === 0 && <p className="wl-empty">Nobody needs action today.</p>}
      <ul className="wl-list">
        {visible.map((row) => (
          <WorklistRow key={row.row_id} row={row} onAction={act} />
        ))}
      </ul>

      <section className="wl-done" aria-label="Work done">
        <div className="wl-done-head">
          <h2>Work done</h2>
          <span>{doneCount} handled</span>
        </div>
        {done.length === 0 ? (
          <p className="wl-empty">Nothing handled yet.</p>
        ) : (
          <ul className="wl-done-list">
            {done.map((d) => (
              <li key={d.row_id} className="wl-done-row">
                <div className="wl-done-person">
                  <span className="wl-done-check" aria-hidden="true">
                    ✓
                  </span>
                  <span className="wl-done-text">
                    <strong>{d.person.display_name}</strong>
                    <span className="wl-subline">{d.reason}</span>
                  </span>
                </div>
                <span className="wl-done-outcome">{d.outcome ?? "Done"}</span>
                <time className="wl-done-time" dateTime={d.done_at}>
                  {formatDate(d.done_at)} {formatTime(d.done_at)}
                </time>
                {d.detail_ref && (
                  <button
                    type="button"
                    className="wl-btn wl-btn-secondary wl-undo"
                    disabled={undoing !== null}
                    aria-busy={undoing === d.row_id}
                    onClick={() => undo(d)}
                  >
                    {undoing === d.row_id ? "Undoing…" : "Undo"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {undoError && (
          <p role="alert" className="wl-error">
            {undoError}
          </p>
        )}
      </section>
    </section>
  );
}
