// Owner: person 1 — provider app shell: login and demo bar (api mocked at the client boundary).
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { App } from "../App";
import { api } from "../api/client";
import { getSession } from "../lib/session";
import { DemoBar } from "./DemoBar";
import { LoginScreen } from "./LoginScreen";

vi.mock("../api/client", () => ({
  api: {
    identities: vi.fn(),
    health: vi.fn(),
    advanceDay: vi.fn(),
  },
}));

const mocked = vi.mocked(api);

function renderLogin() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/worklist" element={<p>worklist page</p>} />
        <Route path="/dashboard" element={<p>dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe("login", () => {
  test("is labelled as a mocked strong identification, not a real one", () => {
    renderLogin();
    expect(screen.getByText(/strong identification \(mocked\)/i)).toBeInTheDocument();
  });

  test("Coordinator fetches the demo identity, keeps the role and opens the Worklist", async () => {
    mocked.identities.mockResolvedValue({ coordinator_id: "coord-1" });
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: "Coordinator" }));
    expect(await screen.findByText("worklist page")).toBeInTheDocument();
    expect(getSession()).toEqual({ role: "coordinator", coordinatorId: "coord-1" });
  });

  test("County viewer opens the Dashboard without any backend call", async () => {
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: "County viewer" }));
    expect(await screen.findByText("dashboard page")).toBeInTheDocument();
    expect(mocked.identities).not.toHaveBeenCalled();
    expect(getSession()).toEqual({ role: "county_viewer" });
  });
});

describe("demo bar", () => {
  test("is present on the login screen too, so the clock can be moved from any view", async () => {
    mocked.health.mockResolvedValue({ status: "ok", db: true, current_demo_day: 0 });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Demo only · day 0/)).toBeInTheDocument();
  });

  test("shows the demo day from /health and is labelled demo only", async () => {
    mocked.health.mockResolvedValue({ status: "ok", db: true, current_demo_day: 3 });
    render(<DemoBar />);
    expect(await screen.findByText(/Demo only · day 3/)).toBeInTheDocument();
  });

  test("Advance one day posts, shows the new day and tells listeners to refresh", async () => {
    mocked.health.mockResolvedValue({ status: "ok", db: true, current_demo_day: 3 });
    mocked.advanceDay.mockResolvedValue({ current_demo_day: 4 });
    const refreshed = vi.fn();
    window.addEventListener("demo-day-advanced", refreshed);
    render(<DemoBar />);
    await userEvent.click(screen.getByRole("button", { name: "Advance one day" }));
    await waitFor(() => expect(screen.getByText(/day 4/)).toBeInTheDocument());
    expect(refreshed).toHaveBeenCalledTimes(1);
    window.removeEventListener("demo-day-advanced", refreshed);
  });
});
