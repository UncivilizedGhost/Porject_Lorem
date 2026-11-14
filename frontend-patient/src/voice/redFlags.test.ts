// Owner: person 4 — the frontend mirror of the server's red-flag list.
import { expect, test } from "vitest";

import { containsRedFlag, SAFETY_MESSAGE } from "./redFlags";

test.each([
  ["I have a fever", "en"],
  ["I'm coughing blood", "en"],
  ["I can't breathe", "en"],
  ["Minulla on kuumetta", "fi"],
  ["Yskin verta", "fi"],
  ["En saa henkeä", "fi"],
  ["Jag har feber", "sv"],
  ["Jag hostar blod", "sv"],
])("%s (%s) is a red flag", (text, language) => {
  expect(containsRedFlag(text, language)).toBe(true);
});

test("ordinary speech is not a red flag", () => {
  expect(containsRedFlag("confirm the chest CT", "en")).toBe(false);
  expect(containsRedFlag("kyllä", "fi")).toBe(false);
});

test("the fixed safety message names 112, 116 117 and the 38 degree rule in every language", () => {
  for (const language of ["fi", "sv", "en"]) {
    const msg = SAFETY_MESSAGE[language];
    expect(msg).toContain("112");
    expect(msg).toContain("116 117");
    expect(msg).toContain("38");
  }
});
