// Owner: person 3 — .scratch/coordinator-worklist/spec.md (artboard "Coordinator worklist")
// Polls GET /worklist every 4 s; rows in band order (red Alerts, call-backs, overdue
// Confirmations, yellow/green), oldest first within a band; workload line; Finnish formats.
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import type { WorklistRow as Row } from "../../api/types";
import { formatDecimal } from "../../lib/format";
import { getSession } from "../../lib/session";
import { usePolling } from "../../lib/usePolling";
import { type RowAction, WorklistRow } from "./WorklistRow";
import "./worklist.css";

export function WorklistScreen() {
  const coordinatorId = getSession()?.coordinatorId ?? "";
  const [version, setVersion] = useState(0);
  const navigate = useNavigate();
  const fetcher = useCallback(() => api.worklist(coordinatorId), [coordinatorId, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const data = usePolling(fetcher, 4000);

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

  const rows = [...(data?.rows ?? [])].sort(
    (a, b) => a.band - b.band || a.created_at.localeCompare(b.created_at),
  );

  return (
    <section className="worklist">
      <h1>Worklist</h1>
      {data && (
        <p className="wl-workload">
          Alerts today: {data.workload.alerts_today} · False alarms: {formatDecimal(data.workload.false_alarm_share * 100, 0)} %
        </p>
      )}
      {data && rows.length === 0 && <p>Nobody needs action today.</p>}
      <ul className="wl-list">
        {rows.map((row) => (
          <WorklistRow key={row.row_id} row={row} onAction={act} />
        ))}
      </ul>
    </section>
  );
}
