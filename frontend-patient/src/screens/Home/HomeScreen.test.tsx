// Seam 2: Home always shows one status line, the next step with one primary action, Nurse
// Aino's card and a way to report a symptom.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { setSession } from "../../lib/session";
import { patient, rules } from "../../test/fixtures";
import { HomeScreen } from "./HomeScreen";

vi.mock("../../api/client", () => ({ api: { getPatient: vi.fn(), rules: vi.fn() } }));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

function renderHome() {
  return render(
    <MemoryRouter>
      <HomeScreen />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  setSession({ role: "patient", patientId: "p1" });
  mockApi.getPatient.mockResolvedValue(patient);
  mockApi.rules.mockResolvedValue(rules);
});

test("on track shows the calm status line", async () => {
  renderHome();
  expect(await screen.findByText("Your tests are going as planned")).toBeInTheDocument();
});

test("running late says Nurse Aino knows", async () => {
  mockApi.getPatient.mockResolvedValue({ ...patient, status: "running_late" });
  renderHome();
  expect(await screen.findByText("Running late, Nurse Aino knows")).toBeInTheDocument();
});

test("the next-step card says what, when and where in Finnish formats", async () => {
  renderHome();
  expect(await screen.findByRole("heading", { name: "Chest CT" })).toBeInTheDocument();
  expect(screen.getByText(/18\.11\./)).toBeInTheDocument();
  expect(screen.getByText(/9\.30/)).toBeInTheDocument();
  expect(screen.getByText(/Jorvi Hospital, Espoo/)).toBeInTheDocument();
});

test("one primary action: Confirm appointment opens that Confirmation", async () => {
  renderHome();
  const link = await screen.findByRole("link", { name: "Confirm appointment" });
  expect(link).toHaveAttribute("href", "/confirm/step1");
});

test("with nothing to confirm there is no Confirm appointment action", async () => {
  mockApi.getPatient.mockResolvedValue({
    ...patient,
    next_step: { ...patient.next_step!, pending_confirmation: null },
  });
  renderHome();
  await screen.findByRole("heading", { name: "Chest CT" });
  expect(screen.queryByRole("link", { name: "Confirm appointment" })).not.toBeInTheDocument();
});

test("practical help: how to get there opens a pop-up with transit, Kela taxi and what to bring", async () => {
  renderHome();
  await userEvent.click(await screen.findByRole("button", { name: "How to get there and what to bring" }));
  const dialog = screen.getByRole("dialog", { name: "How to get there" });
  expect(within(dialog).getByRole("link", { name: /HSL journey planner/ })).toHaveAttribute("href", "https://reittiopas.hsl.fi/");
  expect(within(dialog).getByRole("link", { name: /Call Kela taxi/ })).toHaveAttribute("href", expect.stringMatching(/^tel:/));
  expect(within(dialog).getByText("Kela card")).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("Nurse Aino's card has a call button and Report a symptom is one tap away", async () => {
  renderHome();
  expect(await screen.findByRole("link", { name: /call nurse aino/i })).toHaveAttribute("href", expect.stringMatching(/^tel:/));
  expect(screen.getByRole("link", { name: /^Report a symptom/ })).toHaveAttribute("href", "/report");
});

test("shows no phase names and no day counter", async () => {
  renderHome();
  await screen.findByRole("heading", { name: "Chest CT" });
  expect(document.body.textContent).not.toMatch(/phase|suspected|day \d|\d+ days/i);
});
