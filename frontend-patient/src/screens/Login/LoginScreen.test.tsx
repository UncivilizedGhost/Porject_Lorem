// Seam 2: the neutral mocked login routes each demo role to the right place.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { getSession } from "../../lib/session";
import { LoginScreen } from "./LoginScreen";

vi.mock("../../api/client", () => ({ api: { identities: vi.fn() } }));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
});

test("is a neutral mocked strong identification with no Suomi.fi or Omapolku branding", () => {
  renderLogin();
  expect(screen.getByText(/strong identification \(mocked\)/i)).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/suomi\.fi|omapolku/i);
});

test("Patient with no Contact starts the risk check", async () => {
  mockApi.identities.mockResolvedValue({ contact_id: null, patient_id: null });
  const user = userEvent.setup();
  renderLogin();
  await user.click(screen.getByRole("button", { name: /i am the patient/i }));
  await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/risk-check"));
});

test("Patient who has been promoted goes to Home and the session remembers the id", async () => {
  mockApi.identities.mockResolvedValue({ contact_id: "c1", patient_id: "p1" });
  const user = userEvent.setup();
  renderLogin();
  await user.click(screen.getByRole("button", { name: /i am the patient/i }));
  await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/home"));
  expect(getSession()).toMatchObject({ role: "patient", patientId: "p1", contactId: "c1" });
});

test("Contact who is not yet a Patient goes to the warning signs", async () => {
  mockApi.identities.mockResolvedValue({ contact_id: "c1", patient_id: null });
  const user = userEvent.setup();
  renderLogin();
  await user.click(screen.getByRole("button", { name: /i am the patient/i }));
  await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/warning-signs"));
});

test("Trusted Person goes to the trusted view for the most recent Patient", async () => {
  mockApi.identities.mockResolvedValue({ contact_id: "c1", patient_id: "p1", trusted_person_name: "Liisa Virtanen" });
  const user = userEvent.setup();
  renderLogin();
  await user.click(screen.getByRole("button", { name: /someone you trust/i }));
  await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/trusted"));
  expect(getSession()).toMatchObject({ role: "trusted_person", patientId: "p1", trustedPersonName: "Liisa Virtanen" });
});

test("a server that cannot be reached shows a plain message", async () => {
  mockApi.identities.mockRejectedValue(new Error("down"));
  const user = userEvent.setup();
  renderLogin();
  await user.click(screen.getByRole("button", { name: /i am the patient/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/could not connect/i);
});
