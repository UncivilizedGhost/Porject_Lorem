// Owner: person 4 — seam 1 (pure). exact label; synonym; unrelated → none; yes/kyllä/ja → yes;
// spoken numbers fi/sv/en incl. "kolmekymmentäkahdeksan pilkku kuusi" → 38.6; never matches
// outside the given actions.
import { describe, expect, test } from "vitest";

import { match } from "./matcher";
import { parseSpokenNumber } from "./numbers";
import type { VoiceAction } from "./types";

const noop = () => undefined;
const actions: VoiceAction[] = [
  { id: "confirm_ct", label: "Confirm the chest CT", synonyms: ["I will come", "confirm"], run: noop },
  { id: "cant_come", label: "I can't come", synonyms: ["cannot come"], run: noop },
  { id: "temp", label: "Temperature", kind: "number", run: noop },
];

describe("matcher: actions", () => {
  test("an exact label matches that action", () => {
    const r = match("Confirm the chest CT", actions, "en");
    expect(r.kind === "action" && r.action.id).toBe("confirm_ct");
  });

  test("case, punctuation and diacritics do not matter", () => {
    const fi: VoiceAction[] = [{ id: "back_pain", label: "Selkäkipu", run: noop }];
    const r = match("selkakipu!", fi, "fi");
    expect(r.kind === "action" && r.action.id).toBe("back_pain");
  });

  test("a synonym matches", () => {
    const r = match("I will come", actions, "en");
    expect(r.kind === "action" && r.action.id).toBe("confirm_ct");
  });

  test("a label contained in a longer sentence matches", () => {
    const r = match("um please confirm the chest CT now", actions, "en");
    expect(r.kind === "action" && r.action.id).toBe("confirm_ct");
  });

  test("an unrelated phrase matches nothing", () => {
    expect(match("what is the weather", actions, "en")).toEqual({ kind: "none" });
  });

  test("only the given actions can match", () => {
    expect(match("confirm the chest CT", [], "en")).toEqual({ kind: "none" });
  });

  test("a number action takes the spoken number as its value", () => {
    const r = match("thirty eight point six", actions, "en");
    expect(r.kind).toBe("action");
    if (r.kind === "action") {
      expect(r.action.id).toBe("temp");
      expect(r.value).toBe(38.6);
    }
  });
});

describe("matcher: global words", () => {
  test.each([
    ["yes", "en"],
    ["Yes.", "en"],
    ["kyllä", "fi"],
    ["joo", "fi"],
    ["ja", "sv"],
    ["yes please", "en"],
  ])("%s (%s) is yes", (word, lang) => {
    expect(match(word, [], lang)).toEqual({ kind: "global", word: "yes" });
  });

  test.each([
    ["no", "en"],
    ["ei", "fi"],
    ["nej", "sv"],
  ])("%s (%s) is no", (word, lang) => {
    expect(match(word, [], lang)).toEqual({ kind: "global", word: "no" });
  });

  test.each([
    ["repeat", "en", "repeat"],
    ["toista", "fi", "repeat"],
    ["upprepa", "sv", "repeat"],
    ["go back", "en", "back"],
    ["takaisin", "fi", "back"],
    ["tillbaka", "sv", "back"],
    ["help", "en", "help"],
    ["apua", "fi", "help"],
    ["hjälp", "sv", "help"],
    ["call my nurse", "en", "call_nurse"],
    ["soita hoitajalle", "fi", "call_nurse"],
    ["ring min sjuksköterska", "sv", "call_nurse"],
  ])("%s (%s) is %s", (phrase, lang, word) => {
    expect(match(phrase, [], lang)).toEqual({ kind: "global", word });
  });

  test("an on-screen action wins over a global word with the same text", () => {
    const options: VoiceAction[] = [{ id: "no_cough", label: "No", run: noop }];
    const r = match("no", options, "en");
    expect(r.kind === "action" && r.action.id).toBe("no_cough");
  });

  test("a word that merely contains 'no' is not the global no", () => {
    expect(match("nothing at all", [], "en")).toEqual({ kind: "none" });
  });
});

describe("spoken numbers", () => {
  test.each([
    ["thirty eight point six", "en", 38.6],
    ["thirty-eight", "en", 38],
    ["twelve", "en", 12],
    ["38.6", "en", 38.6],
    ["38,6", "fi", 38.6],
    ["kolmekymmentäkahdeksan pilkku kuusi", "fi", 38.6],
    ["kaksitoista", "fi", 12],
    ["kymmenen", "fi", 10],
    ["yksi", "fi", 1],
    ["trettioåtta komma sex", "sv", 38.6],
    ["trettio åtta", "sv", 38],
    ["tolv", "sv", 12],
    ["it is thirty seven point two degrees", "en", 37.2],
  ])("%s (%s) → %d", (text, lang, expected) => {
    expect(parseSpokenNumber(text, lang)).toBe(expected);
  });

  test("text without a number gives null", () => {
    expect(parseSpokenNumber("hello there", "en")).toBeNull();
  });
});
