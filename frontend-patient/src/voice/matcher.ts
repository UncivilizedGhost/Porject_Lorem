// Owner: person 4 — pure matcher: (transcript, actions, language) → MatchResult.
// Lowercase, strip punctuation and fi/sv diacritic variants; exact or contained label/synonym;
// spoken numbers (numbers.ts); global words yes/no/repeat/back/help/"call my nurse" in fi/sv/en.
// No language model (ADR-0005). A match is only ever among the given actions.
import { normalize } from "./normalize";
import { parseSpokenNumber } from "./numbers";
import type { MatchResult, VoiceAction } from "./types";

type GlobalWord = Extract<MatchResult, { kind: "global" }>["word"];

// Normalised (no diacritics). English is always accepted as a fallback.
const GLOBAL_WORDS: Record<string, Record<GlobalWord, string[]>> = {
  en: {
    yes: ["yes", "yeah", "yep", "sure", "okay", "ok"],
    no: ["no", "nope"],
    repeat: ["repeat", "say again", "again", "repeat that"],
    back: ["back", "go back"],
    help: ["help"],
    call_nurse: ["call my nurse", "call nurse", "call the nurse"],
  },
  fi: {
    yes: ["kylla", "joo", "jep", "juu"],
    no: ["ei"],
    repeat: ["toista", "uudestaan", "uudelleen", "toista se"],
    back: ["takaisin", "edellinen"],
    help: ["apua", "apu", "ohje", "ohjeet"],
    call_nurse: ["soita hoitajalle", "soita hoitaja", "soita hoitajani"],
  },
  sv: {
    yes: ["ja", "jo", "japp"],
    no: ["nej", "nae"],
    repeat: ["upprepa", "igen", "en gang till"],
    back: ["tillbaka"],
    help: ["hjalp"],
    call_nurse: ["ring min sjukskoterska", "ring sjukskoterskan", "ring sjukskoterska"],
  },
};

const WORD_ORDER: GlobalWord[] = ["call_nurse", "repeat", "back", "help", "yes", "no"];

function phrasesFor(word: GlobalWord, language: string): string[] {
  return [...(GLOBAL_WORDS[language]?.[word] ?? []), ...GLOBAL_WORDS.en[word]];
}

function containsPhrase(haystack: string, phrase: string): boolean {
  return ` ${haystack} `.includes(` ${phrase} `);
}

function labelsOf(action: VoiceAction): string[] {
  return [action.label, ...(action.synonyms ?? [])].map(normalize).filter(Boolean);
}

function globalExact(t: string, language: string): GlobalWord | null {
  for (const word of WORD_ORDER) if (phrasesFor(word, language).includes(t)) return word;
  return null;
}

function globalLoose(t: string, language: string): GlobalWord | null {
  const first = t.split(" ")[0];
  const short = t.split(" ").length <= 3;
  for (const word of WORD_ORDER) {
    const phrases = phrasesFor(word, language);
    if (word === "yes" || word === "no") {
      // "yes please": the first word decides, but only in a short utterance.
      if (short && phrases.includes(first)) return word;
    } else if (phrases.some((p) => p.includes(" ") && containsPhrase(t, p))) {
      return word;
    }
  }
  return null;
}

export function match(transcript: string, actions: VoiceAction[], language: string): MatchResult {
  const t = normalize(transcript);
  if (!t) return { kind: "none" };

  // 1. exact label or synonym of an on-screen action
  for (const action of actions) {
    if (action.kind !== "number" && labelsOf(action).includes(t)) return { kind: "action", action };
  }
  // 2. exact global word
  const exact = globalExact(t, language);
  if (exact) return { kind: "global", word: exact };
  // 3. a spoken number goes to the number action on screen
  const numberActions = actions.filter((a) => a.kind === "number");
  if (numberActions.length > 0) {
    const value = parseSpokenNumber(t, language);
    if (value !== null) {
      const named = numberActions.find((a) => labelsOf(a).some((l) => containsPhrase(t, l)));
      return { kind: "action", action: named ?? numberActions[0], value };
    }
  }
  // 4. a label or synonym contained in the sentence (longest label wins)
  let best: { action: VoiceAction; length: number } | null = null;
  for (const action of actions) {
    if (action.kind === "number") continue;
    for (const label of labelsOf(action)) {
      if (containsPhrase(t, label) && (!best || label.length > best.length)) best = { action, length: label.length };
    }
  }
  if (best) return { kind: "action", action: best.action };
  // 5. looser global phrases ("yes please", "please call my nurse")
  const loose = globalLoose(t, language);
  if (loose) return { kind: "global", word: loose };
  return { kind: "none" };
}
