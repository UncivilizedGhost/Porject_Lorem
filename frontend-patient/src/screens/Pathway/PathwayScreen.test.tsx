// Seam 2: Pathway shows the 6-week goal and the steps done and coming; future dates are estimates.
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { setSession } from "../../lib/session";
import { patient } from "../../test/fixtures";
import { PathwayScreen } from "./PathwayScreen";

vi.mock("../../api/client", () => ({ api: { getPatient: vi.fn() } }));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  setSession({ role: "patient", patientId: "p1" });
  mockApi.getPatient.mockResolvedValue(patient);
});

function renderPathway() {
  return render(
    <MemoryRouter>
      <PathwayScreen />
    </MemoryRouter>,
  );
}

test("states the 6-week goal", async () => {
  renderPathway();
  expect(
    await screen.findByText(/if you need treatment, it starts within 6 weeks of your referral/i),
  ).toBeInTheDocument();
});

test("lists every step with whether it is done, next or coming", async () => {
  renderPathway();
  const items = await screen.findAllByRole("listitem");
  expect(items).toHaveLength(3);
  expect(within(items[0]).getByText(/done/i)).toBeInTheDocument();
  expect(within(items[1]).getByText(/next/i)).toBeInTheDocument();
  expect(within(items[2]).getByText(/coming/i)).toBeInTheDocument();
});

test("future dates are marked as estimates, done dates are not", async () => {
  renderPathway();
  const items = await screen.findAllByRole("listitem");
  expect(within(items[0]).getByText("14.11.")).toBeInTheDocument();
  expect(within(items[1]).getByText(/about 18\.11\./i)).toBeInTheDocument();
  expect(within(items[2]).getByText(/about 25\.11\./i)).toBeInTheDocument();
});
