// Owner: person 4 — mirror of server/app/services/learn/red_flags.py: fixed fi/sv/en word list.
// A hit in a spoken Check-in answer or dictated Own Words speaks the fixed safety message at
// once (priority). The answer is still saved unchanged; grading stays on the server (ADR-0006).
import { normalize } from "./normalize";

// Stems matched as substrings of the normalised text (no diacritics, no apostrophes).
export const RED_FLAG_WORDS: Record<string, string[]> = {
  fi: ["kuume", "verta", "veri", "veres", "verin", "en saa henkea", "hengenahdist", "vaikea hengittaa", "rintakipu"],
  sv: ["feber", "blod", "kan inte andas", "andnod", "brostsmarta"],
  en: [
    "fever", "blood", "bleeding", "cant breathe", "cannot breathe", "can not breathe",
    "short of breath", "difficulty breathing", "chest pain",
  ],
};

export const SAFETY_MESSAGE: Record<string, string> = {
  fi:
    "Tämä voi olla vaarallista. Hätätilanteessa soita 112. Neuvoa saat myös numerosta 116 117. " +
    "Jos sinulla on syöpähoidon aikana yli 38 asteen kuume, mene päivystykseen heti.",
  sv:
    "Det här kan vara farligt. Ring 112 vid akut fara. Du kan också ringa 116 117 för råd. " +
    "Om du har över 38 graders feber under cancerbehandling ska du genast åka till akuten.",
  en:
    "This could be serious. In an emergency call 112. You can also call 116 117 for advice. " +
    "If you have a temperature of 38 °C or higher during cancer treatment, go to the emergency department now.",
};

export function containsRedFlag(text: string, language: string): boolean {
  const haystack = normalize(text);
  return (RED_FLAG_WORDS[language] ?? []).some((word) => haystack.includes(word));
}
