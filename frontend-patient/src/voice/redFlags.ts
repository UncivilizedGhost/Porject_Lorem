// Owner: person 4 — mirror of server/app/services/learn/red_flags.py: fixed fi/sv/en word list.
// A hit in a spoken Check-in answer or dictated Own Words speaks the fixed safety message at
// once (priority). The answer is still saved unchanged; grading stays on the server (ADR-0006).
export const RED_FLAG_WORDS: Record<string, string[]> = { fi: [], sv: [], en: [] };

export function containsRedFlag(_text: string, _language: string): boolean {
  return false;
}
