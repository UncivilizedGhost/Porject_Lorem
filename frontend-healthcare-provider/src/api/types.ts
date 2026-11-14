// Client-side mirror of the contract. Replace `unknown` as the server lands.

export type Grade = "red" | "yellow" | "green";

export interface WorklistRow {
  row_id: string;
  kind: "alert" | "callback" | "escalation";
  band: 1 | 2 | 3 | 4;
  level: Grade | null;
  person: { subject_type: "contact" | "patient"; subject_id: string; display_name: string; county: string };
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
