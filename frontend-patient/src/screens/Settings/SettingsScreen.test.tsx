// Seam 2: language, text size, high contrast, Read-aloud and Voice Mode are saved on the
// record with a partial PATCH and applied at once.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { setSession } from "../../lib/session";
import { patient } from "../../test/fixtures";
import { SettingsScreen } from "./SettingsScreen";

vi.mock("../../api/client", () => ({
  api: { getPatient: vi.fn(), getContact: vi.fn(), patchAccessibility: vi.fn() },
}));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  delete document.documentElement.dataset.textSize;
  delete document.documentElement.dataset.contrast;
  setSession({ role: "patient", patientId: "p1", contactId: "c1" });
  mockApi.getPatient.mockResolvedValue(patient);
  mockApi.patchAccessibility.mockResolvedValue({});
});

function renderScreen() {
  return render(
    <MemoryRouter>
      <SettingsScreen />
    </MemoryRouter>,
  );
}

test("choosing XL saves only the text size and applies it to the page", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("radio", { name: "XL" }));
  await waitFor(() => expect(mockApi.patchAccessibility).toHaveBeenCalledWith("patients", "p1", { text_size: "xl" }));
  expect(document.documentElement.dataset.textSize).toBe("xl");
  expect(screen.getByRole("radio", { name: "XL" })).toBeChecked();
});

test("high contrast switches the contrast tokens", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("checkbox", { name: /high contrast/i }));
  await waitFor(() => expect(mockApi.patchAccessibility).toHaveBeenCalledWith("patients", "p1", { high_contrast: true }));
  expect(document.documentElement.dataset.contrast).toBe("high");
});

test("Voice Mode and language are saved the same way", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("checkbox", { name: /voice mode/i }));
  await user.click(screen.getByRole("radio", { name: "Svenska" }));
  await waitFor(() => expect(mockApi.patchAccessibility).toHaveBeenCalledTimes(2));
  expect(mockApi.patchAccessibility).toHaveBeenCalledWith("patients", "p1", { voice_mode: true });
  expect(mockApi.patchAccessibility).toHaveBeenCalledWith("patients", "p1", { language: "sv" });
});

test("a Contact's settings go to the contact record", async () => {
  setSession({ role: "patient", contactId: "c1" });
  mockApi.getContact.mockResolvedValue({
    _id: "c1", county: "Western Uusimaa", language: "en", promoted_patient_id: null,
    accessibility: patient.accessibility, risk_check: { taken: true, risk_group: null },
  });
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("radio", { name: "L" }));
  await waitFor(() => expect(mockApi.patchAccessibility).toHaveBeenCalledWith("contacts", "c1", { text_size: "l" }));
});
