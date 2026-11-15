import { test, expect } from "vitest";
import { classify } from "./RiskCheckResult";

test("classify returns A for never smoked, young age", () => {
  expect(classify({ age: 45, current_smoker: "no", ex_smoker: "no", cigarettes_per_day: 0, years_smoked: 0, breathlessness: "no", frequent_coughing: "no", lung_diagnosis: "no", malignancy: "no", inhaled_medication: "no" }, "never_smoked")).toBe("A");
});

test("current smoker age 60 is Category B", async () => {
  expect(classify({ age: 60, current_smoker: "yes", ex_smoker: "no", cigarettes_per_day: 20, years_smoked: 30, frequent_coughing: "no", breathlessness: "no", inhaled_medication: "no", lung_diagnosis: "no", malignancy: "no" }, null)).toBe("B");
});

test("age 68 ex-smoker is Category B", async () => {
  expect(classify({ age: 68, current_smoker: "no", ex_smoker: "yes", cigarettes_per_day: 0, years_smoked: 25, frequent_coughing: "no", breathlessness: "no", inhaled_medication: "no", lung_diagnosis: "no", malignancy: "no" }, null)).toBe("B");
});

test("80-year-old current smoker is Category B", async () => {
  expect(classify({ age: 80, current_smoker: "yes", ex_smoker: "no", cigarettes_per_day: 40, years_smoked: 50, frequent_coughing: "no", breathlessness: "no", inhaled_medication: "no", lung_diagnosis: "no", malignancy: "no" }, null)).toBe("B");
});

test("breathless smoker age 80: Category B", async () => {
  expect(classify({ age: 80, current_smoker: "yes", ex_smoker: "no", cigarettes_per_day: 30, years_smoked: 40, frequent_coughing: "no", breathlessness: "yes", inhaled_medication: "no", lung_diagnosis: "no", malignancy: "no" }, null)).toBe("B");
});