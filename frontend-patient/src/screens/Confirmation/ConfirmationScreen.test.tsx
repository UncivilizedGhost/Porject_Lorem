// Seam 2: the slider's "Or tap here to confirm" button calls confirm; the slider is
// keyboard-operable; a Trusted Person's Confirmation is sent as trusted_person.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { setSession } from "../../lib/session";
import { patient } from "../../test/fixtures";
import { ConfirmationScreen } from "./ConfirmationScreen";

vi.mock("../../api/client", () => ({
  api: { getPatient: vi.fn(), trustedView: vi.fn(), confirm: vi.fn() },
}));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={["/confirm/step1"]}>
      <Routes>
        <Route path="/confirm/:stepId" element={<ConfirmationScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  setSession({ role: "patient", patientId: "p1" });
  mockApi.getPatient.mockResolvedValue(patient);
  mockApi.trustedView.mockResolvedValue({
    _id: "p1", status: "on_track", next_step: patient.next_step, appointments: [], trusted_people: [],
  });
  mockApi.confirm.mockResolvedValue({});
});

test("shows what is being confirmed with Finnish date and time", async () => {
  renderScreen();
  expect(await screen.findByRole("heading", { name: /chest ct/i })).toBeInTheDocument();
  expect(screen.getByText(/18\.11\./)).toBeInTheDocument();
  expect(screen.getByText(/9\.30/)).toBeInTheDocument();
  expect(screen.getByText(/Jorvi Hospital/)).toBeInTheDocument();
});

test("Or tap here to confirm calls confirm for that step and says it is done", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("button", { name: "Or tap here to confirm" }));
  await waitFor(() => expect(mockApi.confirm).toHaveBeenCalledWith("step1", { actor: "self" }));
  expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
  expect(screen.getByText(/no more reminders/i)).toBeInTheDocument();
});

test("the slider confirms from the keyboard", async () => {
  const user = userEvent.setup();
  renderScreen();
  const slider = await screen.findByRole("slider", { name: /slide to confirm/i });
  slider.focus();
  await user.keyboard("{End}");
  await waitFor(() => expect(mockApi.confirm).toHaveBeenCalledTimes(1));
});

test("a Trusted Person confirms on the Patient's behalf and is named", async () => {
  setSession({ role: "trusted_person", patientId: "p1", trustedPersonName: "Liisa Virtanen" });
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("button", { name: "Or tap here to confirm" }));
  await waitFor(() =>
    expect(mockApi.confirm).toHaveBeenCalledWith("step1", {
      actor: "trusted_person",
      trusted_person_name: "Liisa Virtanen",
    }),
  );
  expect(mockApi.getPatient).not.toHaveBeenCalled(); // a Trusted Person only reads the trusted view
});

test("a failed confirmation is explained and can be retried", async () => {
  mockApi.confirm.mockRejectedValueOnce(new Error("500"));
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("button", { name: "Or tap here to confirm" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/could not confirm/i);
  await user.click(screen.getByRole("button", { name: "Or tap here to confirm" }));
  expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
});
