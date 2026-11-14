// Seam 2: the trusted-person view sends actor "trusted_person" and shows no past answers.
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { setSession } from "../../lib/session";
import { patient } from "../../test/fixtures";
import { TrustedPersonView } from "./TrustedPersonView";

vi.mock("../../api/client", () => ({
  api: { getPatient: vi.fn(), trustedView: vi.fn() },
}));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  setSession({ role: "trusted_person", patientId: "p1", trustedPersonName: "Liisa Virtanen" });
  mockApi.trustedView.mockResolvedValue({
    _id: "p1",
    status: "on_track",
    next_step: patient.next_step,
    appointments: [{ _id: "a1", what: "Chest CT", at: "2026-11-18T09:30:00", where: "Jorvi Hospital, Espoo" }],
    trusted_people: patient.trusted_people,
  });
});

function renderView() {
  return render(
    <MemoryRouter>
      <TrustedPersonView />
    </MemoryRouter>,
  );
}

test("lists the appointments and the pending Confirmation with a way to confirm", async () => {
  renderView();
  expect(await screen.findByText(/Chest CT/)).toBeInTheDocument();
  expect(screen.getByText(/18\.11\./)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /confirm.*for them/i })).toHaveAttribute("href", "/confirm/step1");
});

test("offers Check-in and Symptom Report on the Patient's behalf and says it is logged", async () => {
  renderView();
  expect(await screen.findByRole("link", { name: /check in for him/i })).toHaveAttribute("href", "/check-in");
  expect(screen.getByRole("link", { name: /report a symptom for him/i })).toHaveAttribute("href", "/report");
  expect(screen.getByText(/shown to the nurse with your name/i)).toBeInTheDocument();
});

test("only the trusted view is fetched and no past answers or clinical notes are shown", async () => {
  renderView();
  await screen.findByText(/Chest CT/);
  expect(mockApi.getPatient).not.toHaveBeenCalled();
  expect(screen.queryByText(/past answers|temperature|notes/i)).not.toBeInTheDocument();
});
