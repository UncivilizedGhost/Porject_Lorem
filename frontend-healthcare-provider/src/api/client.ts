// One API client wrapping fetch. Tests mock this module.

const BASE = "/api";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  // shared
  health: () => request<{ status: string; mongo: boolean; current_demo_day: number | null }>("GET", "/health"),
  advanceDay: () => request<{ current_demo_day: number }>("POST", "/demo/advance-day"),
  identities: () => request<{ coordinator_id: string }>("GET", "/demo/identities"),
  reset: () => request<unknown>("POST", "/demo/reset"),

  // person 3: worklist
  worklist: (coordinatorId: string) => request<unknown>("GET", `/worklist?coordinator_id=${coordinatorId}`),
  acknowledge: (alertId: string, coordinatorId: string) =>
    request<unknown>("POST", `/alerts/${alertId}/acknowledge`, { coordinator_id: coordinatorId }),
  alertAction: (alertId: string, body: { action: string; note?: string }) =>
    request<unknown>("POST", `/alerts/${alertId}/actions`, body),
  promote: (contactId: string) => request<unknown>("POST", `/contacts/${contactId}/promote`),
  callbackHandled: (contactId: string) => request<unknown>("POST", `/contacts/${contactId}/callback-handled`),
  stepHandled: (stepId: string) => request<unknown>("POST", `/escalation-steps/${stepId}/handled`),
  clinicians: (type: string) => request<unknown>("GET", `/clinicians?type=${type}`),
  availability: (id: string, from: string, to: string) =>
    request<unknown>("GET", `/clinicians/${id}/availability?from=${from}&to=${to}`),
  book: (body: object) => request<unknown>("POST", "/appointments", body),

  // person 1: dashboard
  counties: () => request<unknown[]>("GET", "/dashboard/counties"),
  county: (name: string) => request<unknown>("GET", `/dashboard/counties/${encodeURIComponent(name)}`),
  actions: () => request<unknown[]>("GET", "/dashboard/actions"),
  insight: (cardId: string) => request<unknown>("GET", `/dashboard/insight/${cardId}`),
  simulate: (body: { card_id: string; dials: Record<string, number> }) => request<unknown>("POST", "/dashboard/simulate", body),
  summary: (cardId: string) => request<unknown>("POST", "/dashboard/summary", { card_id: cardId }),
  createDecision: (body: object) => request<unknown>("POST", "/dashboard/decisions", body),
  decisions: (cardId: string) => request<unknown[]>("GET", `/dashboard/decisions?card_id=${encodeURIComponent(cardId)}`),

  // person 4: sim log
  simLog: (limit = 50) => request<unknown[]>("GET", `/sim/log?limit=${limit}`),
  simReply: (eventId: string, text: string) => request<unknown>("POST", `/sim/sms/${eventId}/reply`, { text }),
};
