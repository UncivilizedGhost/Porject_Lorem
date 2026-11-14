// Owner: person 4 — pure matcher: (transcript, actions, language) → MatchResult.
// Lowercase, strip punctuation and fi/sv diacritic variants; exact or contained label/synonym;
// spoken numbers (numbers.ts); global words yes/no/repeat/back/help/"call my nurse" in fi/sv/en.
// No language model (ADR-0005). A match is only ever among the given actions.
import type { MatchResult, VoiceAction } from "./types";

export function match(_transcript: string, _actions: VoiceAction[], _language: string): MatchResult {
  // TODO(person 4)
  return { kind: "none" };
}
