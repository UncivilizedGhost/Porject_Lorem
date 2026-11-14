// Owner: person 1 — seam 3 (components, API client mocked). .scratch/equity-dashboard/spec.md
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { api } from "../../api/client";
import type { CountyDetail, CountySummary } from "../../api/types";
import { CountyView } from "./CountyView";
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

const WU: CountyDetail = {
  ...county("Western Uusimaa", 64.2, 1, 6),
  pct_outside_fast_track: 31,
  days_per_phase: { detection: 31, referral: 14, diagnosis: 17, treatment: 12 },
  stage_warning_days: { detection: 28, referral: 10, diagnosis: 21, treatment: 14 },
  causes: { referral: { unconfirmed: 0.46, transport: 0.21, waiting_for_slot: 0.33 } },
  breakdown: {
    age: { "75+": { pct_within_target: 46, n: 186, small_sample: false } },
    language: {
      Swedish: { pct_within_target: 60.5, n: 14, small_sample: true },
      Other: { suppressed: true },
    },
    education_group: { basic: { pct_within_target: 56, n: 150, small_sample: false } },
    municipality_type: { rural: { pct_within_target: 58, n: 100, small_sample: false } },
  },
  insight_card_id: "western-uusimaa/missed-first-visits-75",
};

function renderCounty() {
  mocked.county.mockResolvedValue(WU);
  return render(
    <MemoryRouter initialEntries={["/dashboard/county/Western%20Uusimaa"]}>
      <Routes>
        <Route path="/dashboard" element={<p>overview page</p>} />
        <Route path="/dashboard/county/:name" element={<CountyView />} />
        <Route path="/dashboard/county/:name/insight/:cardSlug" element={<p>card page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("county pathway view", () => {
  test("a suppressed cell says 'not enough data' and shows no figure", async () => {
    renderCounty();
    const row = (await screen.findByText("Other")).closest("tr")!;
    expect(within(row).getByText("not enough data")).toBeInTheDocument();
    expect(row.textContent).not.toMatch(/\d/);
  });

  test("a cell under 20 people carries a small-sample warning; larger cells do not", async () => {
    renderCounty();
    const swedish = (await screen.findByText("Swedish")).closest("tr")!;
    expect(within(swedish).getByText(/small sample/i)).toBeInTheDocument();
    const older = screen.getByText("75+").closest("tr")!;
    expect(within(older).queryByText(/small sample/i)).not.toBeInTheDocument();
    expect(older).toHaveTextContent("46 %");
  });

  test("colours a phase only when its days exceed the stage warning", async () => {
    renderCounty();
    await screen.findByRole("group", { name: /days per phase/i });
    const phase = (name: string) => screen.getByTestId(`phase-${name}`);
    expect(phase("detection")).toHaveAttribute("data-exceeded", "true"); // 31 > 28
    expect(phase("referral")).toHaveAttribute("data-exceeded", "true"); // 14 > 10
    expect(phase("diagnosis")).toHaveAttribute("data-exceeded", "false"); // 17 <= 21
    expect(phase("treatment")).toHaveAttribute("data-exceeded", "false"); // 12 <= 14
  });

  test("shows the share of lung cancers diagnosed outside the fast-track", async () => {
    renderCounty();
    expect(await screen.findByRole("group", { name: /outside the fast-track/i })).toHaveTextContent("31 %");
  });

  test("labels the pathway bar, breakdown and fast-track share as synthetic", async () => {
    renderCounty();
    for (const name of [/days per phase/i, /equity breakdown/i, /outside the fast-track/i]) {
      expect(within(await screen.findByRole("group", { name })).getByText("Synthetic")).toBeInTheDocument();
    }
  });

  test("links the over-75 gap to its Insight Card and back to the overview", async () => {
    renderCounty();
    await userEvent.click(await screen.findByRole("link", { name: /Insight Card/i }));
    expect(await screen.findByText("card page")).toBeInTheDocument();
  });

  test("has a way back to the national overview", async () => {
    renderCounty();
    await userEvent.click(await screen.findByRole("link", { name: /national overview/i }));
    expect(await screen.findByText("overview page")).toBeInTheDocument();
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
