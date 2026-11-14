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
export interface WorklistDoneRow {
  row_id: string;
  kind: "alert" | "callback" | "escalation";
  level: Grade | null;
  label: string | null;
  person: WorklistRow["person"];
  reason: string;
  done_at: string;
  outcome: string | null;
  detail_ref: string | null;
}

export interface WorklistResponse {
  rows: WorklistRow[];
  done?: WorklistDoneRow[];
  workload: {
    alerts_today: number;
    false_alarm_share: number;
    open_count?: number;
    done_count?: number;
    pct_done?: number;
  };
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

export interface Clinician {
  id: string;
  name: string;
  types: string[];
  location: string;
  working_days: number[]; // ISO weekdays, 1 = Monday
  hours: { start: string; end: string };
}

export interface Availability {
  clinician_id: string;
  working_days: number[];
  days: { date: string; slots: string[] }[];
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

export type Phase = "detection" | "referral" | "diagnosis" | "treatment";

// ethnicity is present only where the fixture provides it (Western Uusimaa for the demo).
export type BreakdownDimension =
  | "age"
  | "language"
  | "ethnicity"
  | "education_group"
  | "municipality_type";

export interface CountyDetail extends CountySummary {
  pct_outside_fast_track: number;
  days_per_phase: Record<Phase, number>;
  stage_warning_days: Record<Phase, number>;
  causes: Record<string, Record<string, number>>;
  breakdown: Partial<Record<BreakdownDimension, Record<string, BreakdownCell>>>;
  insight_card_id?: string;
}

export type Badge = "trial_review" | "registry_evaluation" | "nordic_policy" | "single_site";

export interface DashboardAction {
  _id: string;
  title: string;
  roadmap_action: string | null;
  evidence: { ref: number; label: string; url: string }[];
  badge: Badge;
  lever: string | null;
  effect: { published: number; low: number; high: number; range_rule: "ci" | "half_to_full" } | null;
}

export interface InsightCardDoc {
  card_id: string;
  what: string;
  where: string;
  who: string;
  stage: Phase;
  cause: string;
  group: string;
  baseline: { pct_within_target: number; n: number; missed_visit_share: number; days_lost_to_missed_visits: number };
  matched_actions: DashboardAction[];
}

export interface Range { low: number; high: number }

export type ActionSimulation =
  | { simulated: false }
  | { simulated: true; assumed_effect: number; days_saved: Range; extra_within_target: Range };

export interface SimulationResult {
  actions: Record<string, ActionSimulation>;
  combined: {
    pct_within_target: Range | null;
    lever_rule_applied: { lever: string; counted: string; not_counted: string[] }[] | null;
  };
  target_gap: {
    needed_for_70: number;
    needed_for_80: number;
    reachable_70: boolean;
    reachable_80: boolean;
    evidence_max_effect: number | null;
    max_achievable_pct: number;
  };
}

export interface SummaryFact { id: string; text: string; value: number | string; source_url?: string }

export interface SummaryResult {
  sentences: { text: string; fact_ids: string[] }[];
  facts: SummaryFact[];
  source: "live" | "pregenerated" | "cached";
}

export interface SuggestionsResult {
  sentences: { text: string; fact_ids: string[] }[];
  facts: SummaryFact[];
  source: "ai" | "rules";
}

export interface DecisionRow {
  _id: string;
  card_id: string;
  action_ids: string[];
  verdict: "approve" | "adapt" | "reject";
  reason: string;
  owner: string;
  due: string;
  decided_by: string;
  demo_day: number;
  created_at: string;
  snapshot: Record<string, unknown>;
}

export interface DecisionInput {
  card_id: string;
  action_ids: string[];
  verdict: DecisionRow["verdict"];
  reason: string;
  owner: string;
  due: string;
  decided_by: string;
  snapshot: Record<string, unknown>;
}

export interface SimLogRow {
  _id: string;
  type: "sms_sent" | "fhir_sync";
  created_at: string;
  payload: Record<string, unknown>;
}
