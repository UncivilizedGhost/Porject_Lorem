// Owner: person 2 — client-side state machine for the Symptom Report (ADR-0006: the client
// never grades; a Safety Check tap goes to R2 as fixed behaviour, the report is still submitted).
//   R1 Safety Check: any item → R2; "None of these" → R3
//   R3 Pick a symptom → R4 guided questions, one per screen (from GET /rules)
//   after each symptom: "Add another symptom" → R3, or → R5
//   R5 Own Words (optional, skippable) → submit
//   result: advice_shown call_now → R2, else R6
export type Step =
  | { screen: "R1" }
  | { screen: "R2"; reason: string }
  | { screen: "R3" }
  | { screen: "R4"; symptom: string; questionIndex: number }
  | { screen: "R5" }
  | { screen: "R6"; advice: "nurse_review" | "self_care" };

export interface ReportDraft {
  ticked: string[];
  symptoms: { symptom: string; answers: Record<string, string | number> }[];
  own_words: { text: string; source: "voice" | "typed" } | null;
}

export const initialDraft: ReportDraft = { ticked: [], symptoms: [], own_words: null };
