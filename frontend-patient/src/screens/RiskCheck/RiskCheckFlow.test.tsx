// Seam 2: the opt-in risk check — one question per screen, consent before the result, taps and
// a number pad only.
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
  expect(screen.getByRole("heading", { name: "How old are you?" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /county/i })).not.toBeInTheDocument();
  await typeNumber(user, "60");
  expect(await screen.findByRole("heading", { name: /county/i })).toBeInTheDocument();
});

test("an eligible answer set asks for consent first, then shows the result with the sign-up link", async () => {
  mockApi.createContact.mockResolvedValue({
    _id: "c9", risk_group: "screening_pilot_eligible",
  } as never);
  const user = userEvent.setup();
  renderFlow();
  await typeNumber(user, "60");
  await user.click(await screen.findByRole("button", { name: "Western Uusimaa" }));
  await user.click(await screen.findByRole("button", { name: "Yes, daily" }));
  await typeNumber(user, "20");
  await typeNumber(user, "30");

  // consent comes before the result and before anything is sent
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
      answers: { age: 60, smoking_status: "daily", cigarettes_per_day: 20, years_smoked: 30 },
    },
  });
  expect(getSession()).toMatchObject({ role: "patient", contactId: "c9" });
});

test("a former smoker skips the cigarette questions and is sent to the warning signs", async () => {
  mockApi.createContact.mockResolvedValue({ _id: "c9", risk_group: "not_eligible" } as never);
  const user = userEvent.setup();
  renderFlow();
  await typeNumber(user, "68");
  await user.click(await screen.findByRole("button", { name: "Western Uusimaa" }));
  await user.click(await screen.findByRole("button", { name: "I used to" }));
  await user.click(await screen.findByRole("button", { name: /no, do not contact me/i }));

  await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/warning-signs"));
  expect(mockApi.createContact).toHaveBeenCalledWith(
    expect.objectContaining({
      consent: { warning_sign_contact: false },
      risk_check: { taken: true, answers: { age: 68, smoking_status: "former" } },
    }),
  );
});

test("a failure to save is explained and nothing is lost", async () => {
  mockApi.createContact.mockRejectedValueOnce(new Error("500"));
  const user = userEvent.setup();
  renderFlow();
  await typeNumber(user, "68");
  await user.click(await screen.findByRole("button", { name: "Western Uusimaa" }));
  await user.click(await screen.findByRole("button", { name: "Never" }));
  await user.click(await screen.findByRole("button", { name: /yes, a nurse may contact me/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/could not save/i);
  mockApi.createContact.mockResolvedValue({ _id: "c1", risk_group: "never_smoked" } as never);
  await user.click(screen.getByRole("button", { name: /try again/i }));
  await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/warning-signs"));
});
