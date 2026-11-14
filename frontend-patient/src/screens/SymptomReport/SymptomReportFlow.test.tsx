// Owner: person 2 — seam 2: any Safety Check item reaches "Call now" in one tap and names it;
// "None of these" → Pick a symptom; nurse_review → Sent, call_now → Call now (api mocked).
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { setSession } from "../../lib/session";
import { rules } from "../../test/fixtures";
import { SymptomReportFlow } from "./SymptomReportFlow";

vi.mock("../../api/client", () => ({
  api: { rules: vi.fn(), symptomReport: vi.fn() },
}));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

function renderFlow() {
  return render(
    <MemoryRouter>
      <SymptomReportFlow />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  setSession({ role: "patient", patientId: "p1" });
  mockApi.rules.mockResolvedValue(rules);
  mockApi.symptomReport.mockResolvedValue({ grade: "yellow", advice_shown: "nurse_review", rule: "x" });
});

test("R1 always shows the not-an-emergency-service note", async () => {
  renderFlow();
  await screen.findByRole("button", { name: "None of these" });
  expect(screen.getByText(/not an emergency service/i)).toBeInTheDocument();
  expect(screen.getByText(/1–2 working days/)).toBeInTheDocument();
  expect(screen.getByText(/116 117/)).toBeInTheDocument();
});

test("tapping a Safety Check item reaches Call now in one tap and names the item", async () => {
  const user = userEvent.setup();
  renderFlow();
  await user.click(await screen.findByRole("button", { name: "Coughing up blood right now" }));

  expect(await screen.findByRole("heading", { name: /call now/i })).toBeInTheDocument();
  expect(screen.getByText(/Coughing up blood right now/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /112/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /116 117/ })).toBeInTheDocument();
  expect(screen.getByText(/Nurse Aino was told/i)).toBeInTheDocument();
  await waitFor(() =>
    expect(mockApi.symptomReport).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ safety_check: { ticked: ["coughing_blood_now"] }, actor: "self" }),
    ),
  );
});

test("None of these goes to Pick a symptom", async () => {
  const user = userEvent.setup();
  renderFlow();
  await user.click(await screen.findByRole("button", { name: "None of these" }));
  expect(await screen.findByRole("heading", { name: /what.*(symptom|bothering)/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Pain" })).toBeInTheDocument();
  expect(mockApi.symptomReport).not.toHaveBeenCalled();
});

test("a report graded nurse_review lands on Sent after guided questions and Own Words", async () => {
  const user = userEvent.setup();
  renderFlow();
  await user.click(await screen.findByRole("button", { name: "None of these" }));
  await user.click(await screen.findByRole("button", { name: "Pain" }));
  await user.click(await screen.findByRole("button", { name: "Severe" }));
  await user.click(await screen.findByRole("button", { name: /no, that.s all/i }));
  await user.click(await screen.findByRole("button", { name: /skip/i }));

  expect(await screen.findByRole("heading", { name: /sent/i })).toBeInTheDocument();
  expect(screen.getByText(/within 1–2 working days/)).toBeInTheDocument();
  expect(mockApi.symptomReport).toHaveBeenCalledTimes(1);
  expect(mockApi.symptomReport).toHaveBeenCalledWith("p1", {
    safety_check: { ticked: [] },
    symptoms: [{ symptom: "pain", answers: { pain_severity: "severe" } }],
    own_words: null,
    actor: "self",
  });
});

test("a report graded call_now lands on Call now instead of Sent", async () => {
  mockApi.symptomReport.mockResolvedValue({ grade: "red", advice_shown: "call_now", rule: "x" });
  const user = userEvent.setup();
  renderFlow();
  await user.click(await screen.findByRole("button", { name: "None of these" }));
  await user.click(await screen.findByRole("button", { name: "Pain" }));
  await user.click(await screen.findByRole("button", { name: "Severe" }));
  await user.click(await screen.findByRole("button", { name: /no, that.s all/i }));
  await user.click(await screen.findByRole("button", { name: /skip/i }));
  expect(await screen.findByRole("heading", { name: /call now/i })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /sent/i })).not.toBeInTheDocument();
});

test("a number question uses the number pad with a decimal comma", async () => {
  const user = userEvent.setup();
  renderFlow();
  await user.click(await screen.findByRole("button", { name: "None of these" }));
  await user.click(await screen.findByRole("button", { name: "Fever or unwell" }));
  for (const key of ["3", "8", ",", "6"]) await user.click(await screen.findByRole("button", { name: key }));
  expect(screen.getByText("38,6")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(await screen.findByRole("button", { name: /no, that.s all/i }));
  await user.click(await screen.findByRole("button", { name: /skip/i }));
  await waitFor(() =>
    expect(mockApi.symptomReport).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        symptoms: [{ symptom: "fever_unwell", answers: { temperature: 38.6 } }],
      }),
    ),
  );
});

test("Add another symptom returns to Pick a symptom and both are sent", async () => {
  const user = userEvent.setup();
  renderFlow();
  await user.click(await screen.findByRole("button", { name: "None of these" }));
  await user.click(await screen.findByRole("button", { name: "Pain" }));
  await user.click(await screen.findByRole("button", { name: "Mild" }));
  await user.click(await screen.findByRole("button", { name: /add another symptom/i }));
  await user.click(await screen.findByRole("button", { name: "Something else" }));
  await user.click(await screen.findByRole("button", { name: "Mild" }));
  await user.click(await screen.findByRole("button", { name: /no, that.s all/i }));
  await user.click(await screen.findByRole("button", { name: /skip/i }));
  await waitFor(() => expect(mockApi.symptomReport).toHaveBeenCalledTimes(1));
  const body = mockApi.symptomReport.mock.calls[0][1] as { symptoms: { symptom: string }[] };
  expect(body.symptoms.map((s) => s.symptom)).toEqual(["pain", "other"]);
});

test("Own Words typed are sent as typed text", async () => {
  const user = userEvent.setup();
  renderFlow();
  await user.click(await screen.findByRole("button", { name: "None of these" }));
  await user.click(await screen.findByRole("button", { name: "Pain" }));
  await user.click(await screen.findByRole("button", { name: "Mild" }));
  await user.click(await screen.findByRole("button", { name: /no, that.s all/i }));
  await user.click(await screen.findByRole("button", { name: /type instead/i }));
  await user.type(screen.getByRole("textbox", { name: /own words/i }), "It hurts at night");
  await user.click(screen.getByRole("button", { name: /send my report/i }));
  await waitFor(() =>
    expect(mockApi.symptomReport).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ own_words: { text: "It hurts at night", source: "typed" } }),
    ),
  );
});

test("a Trusted Person's report is sent as trusted_person with their name", async () => {
  setSession({ role: "trusted_person", patientId: "p1", trustedPersonName: "Liisa Virtanen" });
  const user = userEvent.setup();
  renderFlow();
  await user.click(await screen.findByRole("button", { name: "Chest pain right now" }));
  await waitFor(() =>
    expect(mockApi.symptomReport).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ actor: "trusted_person", trusted_person_name: "Liisa Virtanen" }),
    ),
  );
});
