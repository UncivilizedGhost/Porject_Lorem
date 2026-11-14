// Client-side mirror of the contract. Replace `unknown` as the server lands.

export type Grade = "red" | "yellow" | "green";

export interface WorklistRow {
  row_id: string;
  kind: "alert" | "callback" | "escalation";
  band: 1 | 2 | 3 | 4;
  level: Grade | null;
  person: {
    subject_type: "contact" | "patient";
    subject_id: string;
    display_name: string;
    county: string;
    phone?: string | null;
  };
  label?: string | null;
  reason: string;
  delivery_status: string[];
  pathway_clock: { day: number; target_days: 42; next_deadline: string | null } | null;
  reported_by: { actor: string; name: string } | null;
  created_at: string;
  waiting_working_days: number | null;
  acknowledged: boolean;
  actions: string[];
  detail_ref: string | null;
}

// detail_ref: alert id for alert rows, escalation step id for escalation rows, contact id for call-backs.
export interface WorklistResponse {
  rows: WorklistRow[];
  workload: { alerts_today: number; false_alarm_share: number };
  current_demo_day: number;
}

export interface AlertCardReport {
  event_id: string;
  type: string;
  created_at: string;
  actor: string;
  input: string;
  grade: Grade | null;
  rule: string | null;
  rules_version: string | null;
  advice_shown: "call_now" | "nurse_review" | "self_care" | null;
  safety_check: { ticked: string[] };
  symptoms: {
    symptom: string;
    grade: Grade;
    answers: Record<string, unknown>;
    answers_plain: { question: string; answer: string }[];
  }[];
  own_words: { text: string; source: "voice" | "typed" } | null;
}

export interface AlertCard {
  _id: string;
  level: Grade;
  reason: string;
  trusted_person_name?: string | null;
  actions_taken: { action: string; by: string; at: string; note: string | null }[];
  person: { display_name: string | null; phone: string | null };
  waiting_working_days: number;
  promise_working_days: [number, number];
  reports: AlertCardReport[];
}

export interface CountySummary {
  name: string;
  tile: { col: number; row: number };
  pct_within_target: number;
  median_days_referral_to_treatment: number;
  reach_rate_over_75: number;
}

export type BreakdownCell =
  | { suppressed: true }
  | { pct_within_target: number; n: number; small_sample: boolean };

export interface SimLogRow {
  _id: string;
  type: "sms_sent" | "fhir_sync";
  created_at: string;
  payload: Record<string, unknown>;
}
