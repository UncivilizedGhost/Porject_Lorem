// Owner: person 4 — spoken-number parsing for fi/sv/en with decimal comma or "point/pilkku/komma".
import { normalize } from "./normalize";

const EN_ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const SV_WORDS: Record<string, number> = {
  noll: 0, en: 1, ett: 1, tva: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, atta: 8, nio: 9,
  tio: 10, elva: 11, tolv: 12, tretton: 13, fjorton: 14, femton: 15, sexton: 16, sjutton: 17,
  arton: 18, nitton: 19,
  tjugo: 20, trettio: 30, fyrtio: 40, femtio: 50, sextio: 60, sjuttio: 70, attio: 80, nittio: 90,
};
const SV_TENS = ["tjugo", "trettio", "fyrtio", "femtio", "sextio", "sjuttio", "attio", "nittio"];

const FI_ONES: Record<string, number> = {
  nolla: 0, yksi: 1, kaksi: 2, kolme: 3, nelja: 4, viisi: 5, kuusi: 6, seitseman: 7,
  kahdeksan: 8, yhdeksan: 9,
};
const FI_ONES_RE = Object.keys(FI_ONES).join("|");
// kolmekymmentakahdeksan, kaksitoista, kymmenen, sata ... (diacritics already stripped)
const FI_COMPOUND = new RegExp(
  `^(?:(${FI_ONES_RE})kymmenta)?(?:(${FI_ONES_RE})toista|(${FI_ONES_RE})|kymmenen)?$`,
);

const DECIMAL_WORDS = new Set(["point", "dot", "pilkku", "piste", "komma"]);
const DIGIT_WORDS: Record<string, number> = {
  ...Object.fromEntries(Object.entries(EN_ONES).filter(([, v]) => v < 10)),
  ...Object.fromEntries(Object.entries(FI_ONES)),
  ...Object.fromEntries(Object.entries(SV_WORDS).filter(([, v]) => v < 10)),
};

function parseFiWord(word: string): number | null {
  if (word === "sata") return 100;
  if (!word) return null;
  const m = FI_COMPOUND.exec(word);
  if (!m) return null;
  const [, tens, teen, ones] = m;
  let value = 0;
  if (tens) value += FI_ONES[tens] * 10;
  if (teen) value += 10 + FI_ONES[teen];
  else if (ones) value += FI_ONES[ones];
  else if (word.endsWith("kymmenen")) value += 10;
  return value;
}

function parseSvWord(word: string): number | null {
  if (word in SV_WORDS) return SV_WORDS[word];
  if (word === "hundra") return 100;
  for (const tens of SV_TENS) {
    if (word.startsWith(tens)) {
      const rest = word.slice(tens.length);
      if (rest in SV_WORDS && SV_WORDS[rest] < 10 && SV_WORDS[rest] > 0) return SV_WORDS[tens] + SV_WORDS[rest];
    }
  }
  return null;
}

function parseInteger(tokens: string[], language: string): number | null {
  if (tokens.length === 0) return null;
  if (tokens.length === 1 && /^\d+$/.test(tokens[0])) return Number(tokens[0]);
  let total = 0;
  for (const token of tokens) {
    if (token === "and" || token === "och") continue;
    let value: number | null;
    if (/^\d+$/.test(token)) value = Number(token);
    else if (token === "hundred") {
      total = (total || 1) * 100;
      continue;
    } else if (language === "fi") value = parseFiWord(token);
    else if (language === "sv") value = parseSvWord(token);
    else value = token in EN_ONES ? EN_ONES[token] : null;
    if (value === null) return null;
    total += value;
  }
  return total;
}

function parseWindow(tokens: string[], language: string): number | null {
  if (tokens.length === 1 && /^\d+[.,]\d+$/.test(tokens[0])) return Number(tokens[0].replace(",", "."));
  const dot = tokens.findIndex((t) => DECIMAL_WORDS.has(t));
  if (dot === -1) return parseInteger(tokens, language);
  const whole = parseInteger(tokens.slice(0, dot), language);
  const fraction = tokens.slice(dot + 1);
  if (whole === null || fraction.length === 0) return null;
  let digits = "";
  for (const t of fraction) {
    if (/^\d+$/.test(t)) digits += t;
    else if (t in DIGIT_WORDS) digits += String(DIGIT_WORDS[t]);
    else return null;
  }
  return Number(`${whole}.${digits}`);
}

export function parseSpokenNumber(text: string, language: string): number | null {
  const tokens = normalize(text).split(" ").filter(Boolean);
  // Longest window first, so "it is thirty seven point two degrees" still finds 37.2.
  for (let size = tokens.length; size >= 1; size--) {
    for (let start = 0; start + size <= tokens.length; start++) {
      const value = parseWindow(tokens.slice(start, start + size), language);
      if (value !== null) return value;
    }
  }
  return null;
}
