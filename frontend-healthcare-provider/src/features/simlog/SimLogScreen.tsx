// Owner: person 4 — .scratch/learn-sms-fhir-voice/spec.md (artboard "Simulated SMS / FHIR log")
// usePolling(api.simLog); rows: time (Finnish), channel, recipient, text, status, "(simulated)" /
// "FHIR mock-up" badge on every row; expandable JSON for FHIR rows; "Simulate reply" (YES) on SMS
// rows → api.simReply. Nothing here is real: ADR-0004.
import { useCallback, useState } from "react";

import { api } from "../../api/client";
import { formatDate, formatTime } from "../../lib/format";
import { usePolling } from "../../lib/usePolling";

interface SimEvent {
  id: string;
  created_at: string;
  type: "sms_sent" | "fhir_sync";
  subject_type: string;
  subject_id: string;
  demo_day: number;
  payload: Record<string, unknown> & {
    to?: string;
    text?: string;
    channel?: "sms" | "auto_call" | "suomi_fi";
    status?: string;
    bundle?: unknown;
  };
}

const CHANNEL_LABEL: Record<string, string> = {
  sms: "Text message",
  auto_call: "Automated call",
  suomi_fi: "Suomi.fi message",
};

function when(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

export function SimLogScreen() {
  const [tick, setTick] = useState(0);
  const fetcher = useCallback(() => api.simLog(100) as Promise<SimEvent[]>, [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = usePolling(fetcher);

  const reply = async (id: string) => {
    await api.simReply(id, "YES");
    setTick((n) => n + 1);
  };

  return (
    <section>
      <h1>Simulated SMS / FHIR log</h1>
      <p>Nothing on this page was really sent. Messages and Kanta syncs are simulated for the demo.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Channel</th>
            <th scope="col">Recipient</th>
            <th scope="col">Text</th>
            <th scope="col">Status</th>
            <th scope="col">Label</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((e) => {
            const fhir = e.type === "fhir_sync";
            const p = e.payload;
            return (
              <tr key={e.id}>
                <td>{when(e.created_at)}</td>
                <td>{fhir ? "Kanta / FHIR" : CHANNEL_LABEL[p.channel ?? "sms"]}</td>
                <td>{fhir ? "Kanta" : p.to}</td>
                <td>
                  {fhir ? (
                    <details>
                      <summary>Show FHIR payload</summary>
                      <pre>{JSON.stringify(p.bundle, null, 2)}</pre>
                    </details>
                  ) : (
                    p.text
                  )}
                </td>
                <td>{fhir ? "synced" : p.status}</td>
                <td>
                  <span className="badge">{fhir ? "FHIR mock-up" : "(simulated)"}</span>
                </td>
                <td>
                  {!fhir && p.status === "sent" && (
                    <button type="button" onClick={() => void reply(e.id)}>
                      Simulate reply (YES)
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows && rows.length === 0 && <p>No messages yet.</p>}
    </section>
  );
}
