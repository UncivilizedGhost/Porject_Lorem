// One API client wrapping fetch. Tests mock this module.
import type {
  CountyDetail,
  CountySummary,
  DashboardAction,
  GroupRef,
  InsightCardDoc,
  SummaryResult,
} from "./types";

import type { AlertCard, Availability, Clinician, WorklistResponse } from "./types";

import { clientId } from "./clientId";

const BASE = "/api";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json", "X-Client-Id": clientId() } : { "X-Client-Id": clientId() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  // shared
  health: () => request<{ status: string; db: boolean; current_demo_day: number | null }>("GET", "/health"),
  advanceDay: () => request<{ current_demo_day: number }>("POST", "/demo/advance-day"),
  identities: () => request<{ coordinator_id: string }>("GET", "/demo/identities"),
  reset: () => request<unknown>("POST", "/demo/reset"),

  // person 3: worklist
  worklist: (coordinatorId: string) =>
    request<WorklistResponse>("GET", `/worklist?coordinator_id=${coordinatorId}`),
  alertCard: (alertId: string) => request<AlertCard>("GET", `/alerts/${alertId}`),
  acknowledge: (alertId: string, coordinatorId: string) =>
    request<unknown>("POST", `/alerts/${alertId}/acknowledge`, { coordinator_id: coordinatorId }),
  alertAction: (alertId: string, body: { action: string; note?: string }) =>
    request<unknown>("POST", `/alerts/${alertId}/actions`, body),
  reopenAlert: (alertId: string) => request<unknown>("POST", `/alerts/${alertId}/reopen`),
  promote: (contactId: string) => request<unknown>("POST", `/contacts/${contactId}/promote`),
  callbackHandled: (contactId: string, status: "handled" | "booked" = "handled") =>
    request<unknown>("POST", `/contacts/${contactId}/callback-handled`, { status }),
  stepHandled: (stepId: string, outcome?: string) =>
    request<unknown>("POST", `/escalation-steps/${stepId}/handled`, outcome ? { outcome } : undefined),
  reopenStep: (stepId: string) => request<unknown>("POST", `/escalation-steps/${stepId}/reopen`),
  clinicians: (type: string) => request<Clinician[]>("GET", `/clinicians?type=${type}`),
  availability: (id: string, from: string, to: string) =>
    request<Availability>("GET", `/clinicians/${id}/availability?from=${from}&to=${to}`),
  book: (body: object) => request<unknown>("POST", "/appointments", body),

  // person 1: dashboard
  counties: () => request<CountySummary[]>("GET", "/dashboard/counties"),
  county: (name: string) => request<CountyDetail>("GET", `/dashboard/counties/${encodeURIComponent(name)}`),
  actions: () => request<DashboardAction[]>("GET", "/dashboard/actions"),
  insight: ({ county, dimension, group }: GroupRef) =>
    request<InsightCardDoc>(
      "GET",
      `/dashboard/counties/${encodeURIComponent(county)}/insight?dimension=${encodeURIComponent(dimension)}&group=${encodeURIComponent(group)}`,
    ),
  summary: (body: GroupRef) => request<SummaryResult>("POST", "/dashboard/summary", body),

  // person 4: sim log
  simLog: (limit = 50) => request<unknown[]>("GET", `/sim/log?limit=${limit}`),
  simReply: (eventId: string, text: string) => request<unknown>("POST", `/sim/sms/${eventId}/reply`, { text }),
};
