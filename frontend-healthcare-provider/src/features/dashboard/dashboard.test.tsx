// Owner: person 1 — seam 3 (components, API client mocked). .scratch/equity-dashboard/spec.md
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { api } from "../../api/client";
import type { CountySummary } from "../../api/types";
import { NationalOverview } from "./NationalOverview";
import { TileMap } from "./components/TileMap";

vi.mock("../../api/client", () => ({
  api: {
    counties: vi.fn(),
    county: vi.fn(),
    insight: vi.fn(),
    simulate: vi.fn(),
    summary: vi.fn(),
    decisions: vi.fn(),
    createDecision: vi.fn(),
  },
}));

const mocked = vi.mocked(api);

function county(name: string, pct: number, col = 0, row = 0, extra: Partial<CountySummary> = {}): CountySummary {
  return {
    name,
    tile: { col, row },
    pct_within_target: pct,
    median_days_referral_to_treatment: 48,
    reach_rate_over_75: 70,
    ...extra,
  };
}

function inRouter(ui: React.ReactElement, path = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard" element={ui} />
        <Route path="/dashboard/county/:name" element={<p>county page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("tile map", () => {
  test.each([
    [59, "under_60"],
    [60, "60_69"],
    [69, "60_69"],
    [70, "70_79"],
    [79, "70_79"],
    [80, "80_plus"],
  ])("a county at %s%% gets the %s band", (pct, expected) => {
    inRouter(<TileMap counties={[county("Testland", pct)]} />);
    expect(screen.getByRole("link", { name: /Testland/ })).toHaveAttribute("data-band", expected);
  });

  test("shows the percentage as text, so colour is never the only cue", () => {
    inRouter(<TileMap counties={[county("Testland", 64.2)]} />);
    expect(within(screen.getByRole("link", { name: /Testland/ })).getByText("64 %")).toBeInTheDocument();
  });

  test("outlines Western Uusimaa and only Western Uusimaa", () => {
    inRouter(<TileMap counties={[county("Western Uusimaa", 64), county("Helsinki", 81, 1, 0)]} />);
    expect(screen.getByRole("link", { name: /Western Uusimaa/ })).toHaveAttribute("data-demo-county", "true");
    expect(screen.getByRole("link", { name: /Helsinki/ })).not.toHaveAttribute("data-demo-county", "true");
  });

  test("clicking a tile opens that county's pathway view", async () => {
    inRouter(<TileMap counties={[county("Western Uusimaa", 64)]} />);
    await userEvent.click(screen.getByRole("link", { name: /Western Uusimaa/ }));
    expect(await screen.findByText("county page")).toBeInTheDocument();
  });

  test("has a legend naming the Norway and Sweden bands", () => {
    inRouter(<TileMap counties={[county("Testland", 64)]} />);
    const legend = screen.getByRole("list", { name: /legend/i });
    expect(legend).toHaveTextContent("under 60%");
    expect(legend).toHaveTextContent("70–79% meets Norway");
    expect(legend).toHaveTextContent("80%+ meets Sweden");
  });
});

describe("national overview", () => {
  beforeEach(() => {
    mocked.counties.mockResolvedValue([
      county("A", 60, 0, 0, { median_days_referral_to_treatment: 40, reach_rate_over_75: 60 }),
      county("B", 80, 1, 0, { median_days_referral_to_treatment: 50, reach_rate_over_75: 80 }),
    ]);
  });

  test("shows the three numbers above the map, with Norway and Sweden lines on the first", async () => {
    inRouter(<NationalOverview />);
    const pct = await screen.findByRole("group", { name: /within target/i });
    expect(within(pct).getByText("70 %")).toBeInTheDocument();
    expect(within(pct).getByText(/Norway 70 %/)).toBeInTheDocument();
    expect(within(pct).getByText(/Sweden 80 %/)).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: /median days/i })).getByText("45")).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: /over 75/i })).getByText("70 %")).toBeInTheDocument();
  });

  test("labels every number, the map legend and the map as synthetic", async () => {
    inRouter(<NationalOverview />);
    for (const name of [/within target/i, /median days/i, /over 75/i, /county map/i]) {
      const section = await screen.findByRole("group", { name });
      expect(within(section).getByText("Synthetic")).toBeInTheDocument();
    }
  });

  test("carries the evidence caveat once, in the footer", async () => {
    inRouter(<NationalOverview />);
    await screen.findByRole("group", { name: /county map/i });
    expect(screen.getAllByText(/Evidence linking time-to-treatment and lung cancer survival is mixed \[28\]/)).toHaveLength(1);
    expect(screen.getByRole("contentinfo")).toHaveTextContent("this dashboard targets equal access and adherence to the national time limit.");
  });
});
