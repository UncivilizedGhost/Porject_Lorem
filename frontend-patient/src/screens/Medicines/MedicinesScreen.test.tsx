// Seam 2: medicines shown by generic label only; taken / skipped / side effect in one tap.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { setSession } from "../../lib/session";
import { patient } from "../../test/fixtures";
import { MedicinesScreen } from "./MedicinesScreen";

vi.mock("../../api/client", () => ({ api: { getPatient: vi.fn(), medicationLog: vi.fn() } }));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  setSession({ role: "patient", patientId: "p1" });
  mockApi.getPatient.mockResolvedValue(patient);
  mockApi.medicationLog.mockResolvedValue({});
});

function renderScreen() {
  return render(
    <MemoryRouter>
      <MedicinesScreen />
    </MemoryRouter>,
  );
}

test("lists medicines by their generic label and says where the list comes from", async () => {
  renderScreen();
  expect(await screen.findByText("Cancer medicine, tablets, morning")).toBeInTheDocument();
  expect(screen.getByText("Medicine for nausea, when needed")).toBeInTheDocument();
  expect(screen.getByText(/kanta \(fhir mock-up\)/i)).toBeInTheDocument();
});

test("a skipped dose or a side effect is logged in one tap", async () => {
  const user = userEvent.setup();
  renderScreen();
  const nausea = (await screen.findByText("Medicine for nausea, when needed")).closest("li")!;
  await user.click(within(nausea).getByRole("button", { name: "I skipped it" }));
  await waitFor(() =>
    expect(mockApi.medicationLog).toHaveBeenCalledWith("p1", {
      medicine_id: "med_nausea", status: "skipped", actor: "self",
    }),
  );
  // A medicine is logged once, so the side effect goes on the other card. It then hands over
  // to the Symptom Report, where a nurse can act on it.
  const morning = (await screen.findByText("Cancer medicine, tablets, morning")).closest("li")!;
  await user.click(within(morning).getByRole("button", { name: "Side effect" }));
  await waitFor(() =>
    expect(mockApi.medicationLog).toHaveBeenCalledWith("p1", {
      medicine_id: "med_morning", status: "side_effect", actor: "self",
    }),
  );
});

test("a medicine is confirmed with one tap on I took it", async () => {
  const user = userEvent.setup();
  renderScreen();
  const morning = (await screen.findByText("Cancer medicine, tablets, morning")).closest("li")!;
  await user.click(within(morning).getByRole("button", { name: "I took it" }));
  await waitFor(() =>
    expect(mockApi.medicationLog).toHaveBeenCalledWith("p1", {
      medicine_id: "med_morning", status: "taken", actor: "self",
    }),
  );
  expect(await within(morning).findByText(/saved/i)).toBeInTheDocument();
});
