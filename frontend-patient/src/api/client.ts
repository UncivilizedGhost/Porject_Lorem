// One API client wrapping fetch. Tests mock this module. Every write adds `input: "voice"`
// when the voice layer is running a voice-confirmed action (see voice/VoiceProvider.tsx), so
// screens never pass it by hand.

import { voiceInputMode } from "../voice/VoiceProvider";

const BASE = "/api";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.status === 204 ? (undefined as T) : res.json();
}

function withInput<B extends object>(body: B): B & { input: "touch" | "voice" } {
  return { ...body, input: voiceInputMode() };
}

export const api = {
  // shared
  health: () => request<{ status: string; mongo: boolean; current_demo_day: number | null }>("GET", "/health"),
  advanceDay: () => request<{ current_demo_day: number }>("POST", "/demo/advance-day"),
  identities: () => request<unknown>("GET", "/demo/identities"),
  rules: () => request<unknown>("GET", "/rules"),

  // person 2 endpoints
  createContact: (body: object) => request<unknown>("POST", "/contacts", body),
  getContact: (id: string) => request<unknown>("GET", `/contacts/${id}`),
  getPatient: (id: string) => request<unknown>("GET", `/patients/${id}`),
  trustedView: (id: string) => request<unknown>("GET", `/patients/${id}/trusted-view`),
  patchAccessibility: (kind: "contacts" | "patients", id: string, body: object) =>
    request<unknown>("PATCH", `/${kind}/${id}/accessibility`, body),

  // person 3 endpoints the companion calls
  warningSignTap: (id: string, body: object) => request<unknown>("POST", `/contacts/${id}/warning-sign-tap`, withInput(body)),
  confirm: (stepId: string, body: object) => request<unknown>("POST", `/escalation-steps/${stepId}/confirm`, withInput(body)),
  checkin: (id: string, body: object) => request<unknown>("POST", `/patients/${id}/checkin`, withInput(body)),
  symptomReport: (id: string, body: object) => request<unknown>("POST", `/patients/${id}/symptom-report`, withInput(body)),
  medicationLog: (id: string, body: object) => request<unknown>("POST", `/patients/${id}/medication-log`, withInput(body)),

  // person 4 endpoints
  kantaMedicines: (id: string) => request<unknown>("GET", `/patients/${id}/kanta-medicines`),
  learnAsk: (body: { question: string; language: string }) => request<unknown>("POST", "/learn/ask", body),
  tts: (body: { text: string; language: string; speed: "normal" | "slow" }) =>
    fetch(`${BASE}/voice/tts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  stt: (form: FormData) => fetch(`${BASE}/voice/stt`, { method: "POST", body: form }),
};
