// Owner: person 1 — .scratch/equity-dashboard/spec.md
// GET /dashboard/decisions?card_id=… newest first (the server orders). Append-only: no edit controls.
import { useEffect, useState } from "react";

import { api } from "../../../api/client";
import type { DecisionRow } from "../../../api/types";
import { formatDate } from "../../../lib/format";

const VERDICT = { approve: "Approved", adapt: "Adapted", reject: "Rejected" } as const;

export function DecisionLog({ cardId, refreshKey }: { cardId: string; refreshKey: number }) {
  const [rows, setRows] = useState<DecisionRow[]>([]);
  useEffect(() => {
    api.decisions(cardId).then(setRows).catch(() => setRows([]));
  }, [cardId, refreshKey]);

  return (
    <section aria-label="Decision Log" className="card">
      <h2>Decision Log</h2>
      {rows.length === 0 ? (
        <p className="muted">No decisions recorded on this card yet.</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r._id}>
              <strong>{VERDICT[r.verdict]}</strong> on demo day {r.demo_day}
              <p className="reason">{r.reason}</p>
              <div className="muted">
                Owner: {r.owner} · due {formatDate(r.due, true)} · by {r.decided_by}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
