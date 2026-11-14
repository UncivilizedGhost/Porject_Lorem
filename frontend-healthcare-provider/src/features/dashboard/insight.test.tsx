// Owner: person 1 — seam 3 for the Insight Card (level 3). API client mocked. .scratch/equity-dashboard/spec.md
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { api } from "../../api/client";
import type {
  CountyDetail,
  DashboardAction,
  DecisionRow,
  InsightCardDoc,
  SimulationResult,
  SummaryResult,
} from "../../api/types";
import { InsightCard } from "./InsightCard";
import { MatchedActions } from "./components/MatchedActions";
import { SimulationPanel } from "./components/SimulationPanel";

vi.mock("../../api/client", () => ({
  api: {
    county: vi.fn(),
    insight: vi.fn(),
    simulate: vi.fn(),
    summary: vi.fn(),
    decisions: vi.fn(),
    createDecision: vi.fn(),
  },
}));
const mocked = vi.mocked(api);

const REMINDERS: DashboardAction = {
  _id: "reminders_nurse_call",
  title: "Phone or SMS reminders, with a nurse call when not confirmed",
  roadmap_action: null,
  evidence: [{ ref: 43, label: "Herlev Hospital study", url: "https://example.org/43" }],
  badge: "single_site",
  lever: "missed_visits",
  effect: { published: 0.43, low: 0.215, high: 0.43, range_rule: "half_to_full" },
};
const COORDINATOR: DashboardAction = {
  _id: "named_coordinator",
  title: "Named coordinator for every patient",
  roadmap_action: "1.2.3 named coordinator",
  evidence: [{ ref: 22, label: "Sweden contact nurse", url: "https://example.org/22" }],
  badge: "nordic_policy",
  lever: "missed_visits",
  effect: null,
};

const CARD: InsightCardDoc = {
  card_id: "western-uusimaa/missed-first-visits-75",
  what: "Missed first visits",
  where: "Western Uusimaa",
  who: "People aged 75 and over",
  stage: "referral",
  cause: "unconfirmed",
  group: "75+",
  baseline: { pct_within_target: 46, n: 186, missed_visit_share: 12, days_lost_to_missed_visits: 14 },
  matched_actions: [REMINDERS, COORDINATOR],
};

const SIM: SimulationResult = {
  actions: {
    reminders_nurse_call: {
      simulated: true,
      assumed_effect: 0.43,
      days_saved: { low: 180, high: 361 },
      extra_within_target: { low: 5, high: 10 },
    },
    named_coordinator: { simulated: false },
  },
  combined: { pct_within_target: { low: 49.2, high: 51.2 }, lever_rule_applied: null },
  target_gap: {
    needed_for_70: 2,
    needed_for_80: 2.83,
    reachable_70: false,
    reachable_80: false,
    evidence_max_effect: 0.43,
    max_achievable_pct: 58,
  },
};

const SUMMARY: SummaryResult = {
  sentences: [
    { text: "Only 46% of over-75s start in time", fact_ids: ["group_pct"] },
    { text: "Reminders cut missed visits in Denmark", fact_ids: ["action_reminders_nurse_call"] },
  ],
  facts: [
    { id: "group_pct", text: "46% of over-75s", value: 46 },
    { id: "action_reminders_nurse_call", text: "Reminders", value: "single_site", source_url: "https://example.org/43" },
  ],
  source: "cached",
};

const COUNTY = {
  causes: { referral: { unconfirmed: 0.46, transport: 0.21, waiting_for_slot: 0.33 } },
} as unknown as CountyDetail;

function renderCard() {
  mocked.insight.mockResolvedValue(CARD);
  mocked.county.mockResolvedValue(COUNTY);
  mocked.simulate.mockResolvedValue(SIM);
  mocked.summary.mockResolvedValue(SUMMARY);
  mocked.decisions.mockResolvedValue([]);
  return render(
    <MemoryRouter initialEntries={["/dashboard/county/Western%20Uusimaa/insight/missed-first-visits-75"]}>
      <Routes>
        <Route path="/dashboard/county/:name/insight/:cardSlug" element={<InsightCard />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("matched actions", () => {
  const renderActions = (actions = [REMINDERS, COORDINATOR], dials = {}) =>
    render(<MatchedActions actions={actions} dials={dials} onDial={() => {}} />);

  test("a Nordic-policy action says 'No effect estimate: not simulated' and offers no dial or number", () => {
    renderActions();
    const article = screen.getByRole("article", { name: /Named coordinator/ });
    expect(within(article).getByText("No effect estimate: not simulated")).toBeInTheDocument();
    expect(within(article).queryByRole("slider")).not.toBeInTheDocument();
    expect(within(article).queryByText(/assumed effect/i)).not.toBeInTheDocument();
    expect(article.textContent).not.toMatch(/\d+\s?%/);
  });

  test("each action carries its evidence badge, roadmap action and evidence links", () => {
    renderActions();
    const named = screen.getByRole("article", { name: /Named coordinator/ });
    expect(within(named).getByText("Nordic national policy (not evaluated)")).toBeInTheDocument();
    expect(within(named).getByText(/1\.2\.3 named coordinator/)).toBeInTheDocument();
    expect(within(named).getByRole("link", { name: /22/ })).toHaveAttribute("href", "https://example.org/22");
    const rem = screen.getByRole("article", { name: /reminders/i });
    expect(within(rem).getByText("Single-site project")).toBeInTheDocument();
  });

  test("a simulated action has one dial bounded to its evidence range, labelled as an assumption in Finland", () => {
    renderActions();
    const dial = screen.getByRole("slider", { name: /assumed effect in Finland/i });
    expect(dial).toHaveAttribute("min", "0.215");
    expect(dial).toHaveAttribute("max", "0.43");
    expect(screen.getByText(/published value/i)).toHaveTextContent("43");
  });

  test("moving the dial reports the new value for that action", async () => {
    const onDial = vi.fn();
    render(<MatchedActions actions={[REMINDERS]} dials={{}} onDial={onDial} />);
    // user-event does not drive range inputs with the keyboard in jsdom, so fire the change directly
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0.3" } });
    expect(onDial).toHaveBeenCalledWith("reminders_nurse_call", 0.3);
  });

  test("says 'Matched', never 'Recommended'", () => {
    renderActions();
    expect(screen.getByRole("heading", { name: /Matched actions/i })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/recommend/i);
  });
});

describe("simulation panel", () => {
  test("shows days saved and extra people within target as ranges, labelled synthetic", () => {
    render(<SimulationPanel result={SIM} actions={[REMINDERS, COORDINATOR]} />);
    const panel = screen.getByRole("group", { name: /simulation/i });
    expect(within(panel).getByText("Synthetic")).toBeInTheDocument();
    expect(within(panel).getByText(/180–361 days/)).toBeInTheDocument();
    expect(within(panel).getByText(/5–10 people/)).toBeInTheDocument();
  });

  test("puts 'needed to reach 70 %' beside 'evidence shows' and says when the gap cannot close", () => {
    render(<SimulationPanel result={SIM} actions={[REMINDERS, COORDINATOR]} />);
    const gap = screen.getByRole("group", { name: /target gap/i });
    expect(gap).toHaveTextContent(/Needed to reach 70 %/);
    expect(gap).toHaveTextContent(/Evidence shows 21,5–43 % fewer missed visits/);
    expect(gap).toHaveTextContent(/cannot close the gap/i);
    expect(gap).toHaveTextContent("58 %");
  });

  test("names the action counted when two actions share a lever", () => {
    const shared: SimulationResult = {
      ...SIM,
      combined: {
        ...SIM.combined,
        lever_rule_applied: [{ lever: "missed_visits", counted: "reminders_nurse_call", not_counted: ["other"] }],
      },
    };
    render(<SimulationPanel result={shared} actions={[REMINDERS, COORDINATOR]} />);
    expect(screen.getByText(/same lever/i)).toHaveTextContent(/larger single effect/i);
  });
});

describe("insight card", () => {
  test("states what, where and who, with the Cause Codes as synthetic shares", async () => {
    renderCard();
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Missed first visits");
    expect(screen.getByText(/Western Uusimaa/, { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/People aged 75 and over/)).toBeInTheDocument();
    const causes = screen.getByRole("group", { name: /cause codes/i });
    expect(within(causes).getByText("Synthetic")).toBeInTheDocument();
    expect(causes).toHaveTextContent("46 %");
    expect(causes).toHaveTextContent(/unconfirmed/i);
    expect(causes).toHaveTextContent(/transport/i);
    expect(causes).toHaveTextContent(/waiting for a slot/i);
  });

  test("every summary sentence links to the fact it came from", async () => {
    renderCard();
    const summary = await screen.findByRole("region", { name: /AI summary/i });
    const links = await within(summary).findAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["#fact-group_pct", "https://example.org/43"]);
    expect(within(summary).getByText(/pre-written/i)).toBeInTheDocument(); // cached source is disclosed
  });

  test("lays out summary, actions, results, decision form and log in the agreed order", async () => {
    renderCard();
    await screen.findByRole("region", { name: /AI summary/i });
    await screen.findByRole("group", { name: /target gap/i });
    const order = ["Cause Codes", "AI summary", "Matched actions", "Simulation", "Record a decision", "Decision Log"];
    const positions = order.map((name) => {
      const el = screen.getByRole("heading", { name: new RegExp(name, "i") });
      return Array.from(document.querySelectorAll("h2")).indexOf(el as HTMLHeadingElement);
    });
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions.every((p) => p >= 0)).toBe(true);
  });

  test("moving a dial re-runs the simulation with that dial value", async () => {
    renderCard();
    fireEvent.change(await screen.findByRole("slider"), { target: { value: "0.3" } });
    await waitFor(() => {
      const last = mocked.simulate.mock.calls.at(-1)![0];
      expect(last.card_id).toBe(CARD.card_id);
      expect(last.dials.reminders_nurse_call).toBe(0.3);
    });
  });
});

describe("decision", () => {
  const saved: DecisionRow = {
    _id: "d1",
    card_id: CARD.card_id,
    action_ids: ["reminders_nurse_call"],
    verdict: "adapt",
    reason: "Start with reminders only",
    owner: "County coordinator team",
    due: "2026-12-15",
    decided_by: "county-viewer",
    demo_day: 2,
    created_at: "2026-11-14T10:00:00",
    snapshot: {},
  };

  test("cannot be submitted without a reason", async () => {
    renderCard();
    const submit = await screen.findByRole("button", { name: /record decision/i });
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/reason/i), "   ");
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/reason/i), "Cheapest lever");
    expect(submit).toBeEnabled();
  });

  test("records the verdict with owner, due date and a snapshot of what was on screen, then lists it", async () => {
    renderCard();
    mocked.createDecision.mockResolvedValue(saved);
    await screen.findByRole("group", { name: /target gap/i }); // the simulation the person saw
    await screen.findByRole("region", { name: /AI summary/i }); // and the summary
    await userEvent.click(screen.getByRole("radio", { name: /adapt/i }));
    await userEvent.type(screen.getByLabelText(/reason/i), "Start with reminders only");
    await userEvent.clear(screen.getByLabelText(/owner/i));
    await userEvent.type(screen.getByLabelText(/owner/i), "County coordinator team");
    await userEvent.clear(screen.getByLabelText(/due date/i));
    await userEvent.type(screen.getByLabelText(/due date/i), "2026-12-15");
    mocked.decisions.mockResolvedValue([saved]);
    await userEvent.click(screen.getByRole("button", { name: /record decision/i }));

    await waitFor(() => expect(mocked.createDecision).toHaveBeenCalledTimes(1));
    const body = mocked.createDecision.mock.calls[0][0];
    expect(body).toMatchObject({
      card_id: CARD.card_id,
      verdict: "adapt",
      reason: "Start with reminders only",
      owner: "County coordinator team",
      due: "2026-12-15",
      action_ids: ["reminders_nurse_call", "named_coordinator"],
    });
    expect(body.snapshot).toMatchObject({
      badges: { reminders_nurse_call: "single_site", named_coordinator: "nordic_policy" },
      simulation: SIM,
    });
    expect((body.snapshot as { facts: unknown[] }).facts.length).toBeGreaterThan(0);

    const log = await screen.findByRole("region", { name: /decision log/i });
    expect(await within(log).findByText("Start with reminders only")).toBeInTheDocument();
  });

  test("the log lists decisions newest first as the server returns them", async () => {
    mocked.decisions.mockResolvedValue([
      { ...saved, _id: "d2", reason: "second" },
      { ...saved, _id: "d1", reason: "first" },
    ]);
    renderCard();
    mocked.decisions.mockResolvedValue([
      { ...saved, _id: "d2", reason: "second" },
      { ...saved, _id: "d1", reason: "first" },
    ]);
    const log = await screen.findByRole("region", { name: /decision log/i });
    await within(log).findByText("second");
    const items = within(log).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("second");
    expect(items[1]).toHaveTextContent("first");
  });
});
