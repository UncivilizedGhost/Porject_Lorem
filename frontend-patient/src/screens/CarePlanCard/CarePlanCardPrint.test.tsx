// Seam 2: the printable care-plan card carries the next step, what to bring and the help
// numbers in spec order.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { setSession } from "../../lib/session";
import { patient } from "../../test/fixtures";
import { CarePlanCardPrint } from "./CarePlanCardPrint";

vi.mock("../../api/client", () => ({ api: { getPatient: vi.fn() } }));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  setSession({ role: "patient", patientId: "p1" });
  mockApi.getPatient.mockResolvedValue(patient);
});

function renderCard() {
  return render(
    <MemoryRouter>
      <CarePlanCardPrint />
    </MemoryRouter>,
  );
}

test("shows what, when, where and what to bring", async () => {
  renderCard();
  expect(await screen.findByText("Chest CT")).toBeInTheDocument();
  expect(screen.getByText(/18\.11\./)).toBeInTheDocument();
  expect(screen.getByText(/9\.30/)).toBeInTheDocument();
  expect(screen.getByText(/Jorvi Hospital, Espoo/)).toBeInTheDocument();
  expect(screen.getByText(/Kela card/)).toBeInTheDocument();
  expect(screen.getByText(/HSL/)).toBeInTheDocument();
});

test("lists 112, then 116 117, then Nurse Aino", async () => {
  renderCard();
  await screen.findByText("Chest CT");
  const text = document.body.textContent ?? "";
  expect(text.indexOf("112")).toBeLessThan(text.indexOf("116 117"));
  expect(text.indexOf("116 117")).toBeLessThan(text.indexOf("Nurse Aino"));
});

test("Print opens the browser's print dialogue", async () => {
  window.print = vi.fn();
  const user = userEvent.setup();
  renderCard();
  await user.click(await screen.findByRole("button", { name: "Print this card" }));
  expect(window.print).toHaveBeenCalled();
});
