// Seam 2: the opt-in risk check — one question per screen, taps and
// a number pad only. Path branching depends on answers.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { getSession } from "../../lib/session";
import { RiskCheckFlow } from "./RiskCheckFlow";

vi.mock("../../api/client", () => ({ api: { createContact: vi.fn() } }));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderFlow() {
  return render(
    <MemoryRouter initialEntries={["/risk-check"]}>
      <Routes>
        <Route path="/risk-check/*" element={<RiskCheckFlow />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function typeNumber(user: ReturnType<typeof userEvent.setup>, digits: string) {
  for (const d of digits) await user.click(screen.getByRole("button", { name: d }));
  await user.click(screen.getByRole("button", { name: "Next" }));
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
});

test("asks one question per screen, starting with age on the number pad", async () => {
  const user = userEvent.setup();
  renderFlow();
  expect(screen.getByRole("group", { name: "What is your age?" })).toBeInTheDocument();
  await typeNumber(user, "60");
  expect(await screen.findByRole("group", { name: "Which wellbeing services county do you live in?" })).toBeInTheDocument();
});

test("current smoker path: county, cigarettes and years questions appear, then consent and result", async () => {
  mockApi.createContact.mockResolvedValue({
    _id: "c9", risk_group: "screening_pilot_eligible",
  } as never);
  const user = userEvent.setup();
  renderFlow();
  await typeNumber(user, "60");
  await user.click(await screen.findByRole("button", { name: "Western Uusimaa" }));
  await user.click(await screen.findByRole("button", { name: "Male" }));
  await user.click(await screen.findByRole("button", { name: "Yes" })); // current smoker
  await typeNumber(user, "20"); // cigarettes per day
  await typeNumber(user, "30"); // years smoked
  await user.click(await screen.findByRole("button", { name: "No" })); // frequent coughing
  await user.click(await screen.findByRole("button", { name: "No" })); // breathlessness
  await user.click(await screen.findByRole("button", { name: "No" })); // inhaled medication
  await user.click(await screen.findByRole("button", { name: "No" })); // lung diagnosis
  await user.click(await screen.findByRole("button", { name: "No" })); // malignancy

  expect(await screen.findByRole("heading", { name: /may a nurse contact you/i })).toBeInTheDocument();
  expect(mockApi.createContact).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: /yes, a nurse may contact me/i }));

  expect(await screen.findByRole("heading", { name: /screening/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", expect.stringMatching(/^https:/));
  expect(mockApi.createContact).toHaveBeenCalledWith({
    county: "Western Uusimaa",
    language: "en",
    consent: { warning_sign_contact: true },
    risk_check: {
      taken: true,
      answers: {
        age: 60,
        sex: "male",
        current_smoker: "yes",
        cigarettes_per_day: 20,
        years_smoked: 30,
        frequent_coughing: "no",
        breathlessness: "no",
        inhaled_medication: "no",
        lung_diagnosis: "no",
        malignancy: "no",
      },
    },
  });
  expect(getSession()).toMatchObject({ role: "patient", contactId: "c9" });
});

test("ex-smoker path: skips cigarette questions, answers years smoked after ex-smoker yes", async () => {
  mockApi.createContact.mockResolvedValue({ _id: "c9", risk_group: "not_eligible" } as never);
  const user = userEvent.setup();
  renderFlow();
  await typeNumber(user, "68");
  await user.click(await screen.findByRole("button", { name: "Western Uusimaa" }));
  await user.click(await screen.findByRole("button", { name: "Female" }));
  await user.click(await screen.findByRole("button", { name: "No" })); // not a current smoker
  await user.click(await screen.findByRole("button", { name: "Yes" })); // is an ex-smoker
  await typeNumber(user, "25"); // years smoked
  await user.click(await screen.findByRole("button", { name: "No" })); // frequent coughing
  await user.click(await screen.findByRole("button", { name: "No" })); // breathlessness
  await user.click(await screen.findByRole("button", { name: "No" })); // inhaled medication
  await user.click(await screen.findByRole("button", { name: "No" })); // lung diagnosis
  await user.click(await screen.findByRole("button", { name: "No" })); // malignancy
  await user.click(await screen.findByRole("button", { name: /no, do not contact me/i }));

  await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/warning-signs"));
  expect(mockApi.createContact).toHaveBeenCalledWith(
    expect.objectContaining({
      county: "Western Uusimaa",
      consent: { warning_sign_contact: false },
      risk_check: {
        taken: true,
        answers: {
          age: 68,
          sex: "female",
          current_smoker: "no",
          ex_smoker: "yes",
          years_smoked: 25,
          frequent_coughing: "no",
          breathlessness: "no",
          inhaled_medication: "no",
          lung_diagnosis: "no",
          malignancy: "no",
        },
      },
    }),
  );
});

test("never smoked path: skips all smoking questions, goes straight to symptoms", async () => {
  mockApi.createContact.mockResolvedValue({ _id: "c9", risk_group: "never_smoked" } as never);
  const user = userEvent.setup();
  renderFlow();
  await typeNumber(user, "45");
  await user.click(await screen.findByRole("button", { name: "Western Uusimaa" }));
  await user.click(await screen.findByRole("button", { name: "Female" }));
  await user.click(await screen.findByRole("button", { name: "No" })); // not a current smoker
  await user.click(await screen.findByRole("button", { name: "No" })); // not an ex-smoker
  // Should skip cigarettes_per_day, years_smoked, ex_smoker years
  expect(await screen.findByRole("group", { name: "Do you suffer from frequent coughing?" })).toBeInTheDocument();
  await user.click(await screen.findByRole("button", { name: "No" }));
  await user.click(await screen.findByRole("button", { name: "No" })); // breathlessness
  await user.click(await screen.findByRole("button", { name: "No" })); // inhaled medication
  await user.click(await screen.findByRole("button", { name: "No" })); // lung diagnosis
  await user.click(await screen.findByRole("button", { name: "No" })); // malignancy
  await user.click(await screen.findByRole("button", { name: /yes, a nurse may contact me/i }));

  await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/warning-signs"));
  expect(mockApi.createContact).toHaveBeenCalledWith(
    expect.objectContaining({
      county: "Western Uusimaa",
      consent: { warning_sign_contact: true },
      risk_check: {
        taken: true,
        answers: {
          age: 45,
          sex: "female",
          current_smoker: "no",
          ex_smoker: "no",
          frequent_coughing: "no",
          breathlessness: "no",
          inhaled_medication: "no",
          lung_diagnosis: "no",
          malignancy: "no",
        },
      },
    }),
  );
});

test("a failure to save is explained and nothing is lost", async () => {
  mockApi.createContact.mockRejectedValueOnce(new Error("500"));
  const user = userEvent.setup();
  renderFlow();
  await typeNumber(user, "68");
  await user.click(await screen.findByRole("button", { name: "Western Uusimaa" }));
  await user.click(await screen.findByRole("button", { name: "Male" }));
  await user.click(await screen.findByRole("button", { name: "No" }));
  await user.click(await screen.findByRole("button", { name: "No" }));
  await user.click(await screen.findByRole("button", { name: "No" }));
  await user.click(await screen.findByRole("button", { name: "No" }));
  await user.click(await screen.findByRole("button", { name: "No" }));
  await user.click(await screen.findByRole("button", { name: "No" }));
  await user.click(await screen.findByRole("button", { name: "No" }));
  await user.click(await screen.findByRole("button", { name: /yes, a nurse may contact me/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/could not save/i);
  mockApi.createContact.mockResolvedValue({ _id: "c1", risk_group: "never_smoked" } as never);
  await user.click(screen.getByRole("button", { name: /try again/i }));
  await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/warning-signs"));
});
