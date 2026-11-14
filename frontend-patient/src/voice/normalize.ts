// Owner: person 4 — text normalisation shared by the matcher, numbers and red flags.
/** Lowercase, drop apostrophes, strip diacritics (ä ö å → a o a), punctuation to spaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9,.]+/g, " ")
    .replace(/(?<!\d)[.,]|[.,](?!\d)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
