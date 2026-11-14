// Owner: person 4 — .scratch/learn-sms-fhir-voice/spec.md ("Voice layer" → screen-facing API)

export interface VoiceAction {
  id: string;
  label: string;
  synonyms?: string[];
  /** Read-back sentence, e.g. "Confirm the chest CT on Tuesday at 9.30?". Defaults to the label as a question. */
  confirm_text?: string;
  /** Number-kind actions accept a spoken number instead of a label. */
  kind?: "label" | "number";
  run: (value?: number) => void | Promise<void>;
}

export interface Readable {
  heading?: string;
  body?: string;
  /** Safety / "Call now" text, always read first. */
  priority?: string;
}

export type MatchResult =
  | { kind: "action"; action: VoiceAction; value?: number }
  | { kind: "global"; word: "yes" | "no" | "repeat" | "back" | "help" | "call_nurse" }
  | { kind: "none" };
