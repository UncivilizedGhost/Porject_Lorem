// Owner: person 1 — seam 3 for the Insight Card (level 3). API client mocked. .scratch/equity-dashboard/spec.md
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { api } from "../../api/client";
import type { InsightCardDoc, RecommendedAction, SummaryResult } from "../../api/types";
import { InsightCard } from "./InsightCard";
import { RecommendedActions } from "./components/RecommendedActions";

vi.mock("../../api/client", () => ({
  api: {
    insight: vi.fn(),
    summary: vi.fn(),
  },
}));
const mocked = vi.mocked(api);

const REMINDERS: RecommendedAction = {
  _id: "reminders_nurse_call",
  title: "Phone or SMS reminders, with a nurse call when not confirmed",
  roadmap_action: null,
  evidence: [{ ref: 43, label: "Herlev Hospital study", url: "https://example.org/43" }],
  badge: "single_site",
  lever: "missed_visits",
  effect: { published: 0.43, low: 0.215, high: 0.43, range_rule: "half_to_full" },
  recommended_because: "Its gap pattern in the Action Library targets people aged 85 and over at the referral stage.",
};
const COORDINATOR: RecommendedAction = {
  _id: "named_coordinator",
  title: "Named coordinator for every patient",
  roadmap_action: "1.2.3 named coordinator",
  evidence: [{ ref: 22, label: "Sweden contact nurse", url: "https://example.org/22" }],
  badge: "nordic_policy",
  lever: "missed_visits",
  effect: null,
  recommended_because: "Its gap pattern in the Action Library covers every group at the referral stage.",
};

const CARD: InsightCardDoc = {
  card_id: "western-uusimaa/age/85+",
  what: "Missed first visits",
  where: "Western Uusimaa",
  who: "People aged 85 and over",
  dimension: "age",
  group: "85+",
  stage: "referral",
  cause: "unconfirmed",
  baseline: { pct_within_target: 29.7, n: 105, small_sample: false },
  county_pct_within_target: 53.6,
  cause_shares: { unconfirmed: 0.46, transport: 0.21, waiting_for_slot: 0.33 },
  recommended_actions: [REMINDERS, COORDINATOR],
};

const SUMMARY: SummaryResult = {
  sentences: [
    { text: "Only 30% of the oldest start in time", fact_ids: ["group_pct"] },
    { text: "Reminders cut missed visits in Denmark", fact_ids: ["action_reminders_nurse_call"] },
  ],
  facts: [
    { id: "group_pct", text: "30% of people aged 85 and over", value: 29.7 },
    { id: "action_reminders_nurse_call", text: "Reminders", value: "single_site", source_url: "https://example.org/43" },
  ],
  source: "rules",
};

function renderCard(summary: SummaryResult = SUMMARY, card: InsightCardDoc = CARD) {
  mocked.insight.mockResolvedValue(card);
  mocked.summary.mockResolvedValue(summary);
  return render(
    <MemoryRouter initialEntries={["/dashboard/county/Western%20Uusimaa/insight?dimension=age&group=85%2B"]}>
      <Routes>
        <Route path="/dashboard/county/:name/insight" element={<InsightCard />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("recommended actions", () => {
  const renderActions = (actions = [REMINDERS, COORDINATOR]) => render(<RecommendedActions actions={actions} />);

  test("are headed 'Recommended actions' and say where the recommendations come from", () => {
    renderActions();
    const section = screen.getByRole("region", { name: /Recommended actions/i });
    expect(section).toHaveTextContent(/matching this group's gap .* to the Action Library/i);
    expect(section).toHaveTextContent(/No AI model picks them/i);
    expect(document.body.textContent).not.toMatch(/matched actions/i);
  });

  test("each action says why it is recommended for this group", () => {
    renderActions();
    expect(screen.getByRole("article", { name: /reminders/i })).toHaveTextContent(
      "Why this is recommended: Its gap pattern in the Action Library targets people aged 85 and over at the referral stage.",
    );
    expect(screen.getByRole("article", { name: /Named coordinator/ })).toHaveTextContent(/covers every group/);
  });

  test("each action carries its evidence badge, roadmap action and evidence links", () => {
    renderActions();
    const named = screen.getByRole("article", { name: /Named coordinator/ });
    expect(within(named).getByText("Nordic national policy (not evaluated)")).toBeInTheDocument();
    expect(within(named).getByText("Strategy / roadmap: 1.2.3 named coordinator")).toBeInTheDocument();
    expect(within(named).getByRole("link", { name: /22/ })).toHaveAttribute("href", "https://example.org/22");
    const rem = screen.getByRole("article", { name: /reminders/i });
    expect(within(rem).getByText("Single-site project")).toBeInTheDocument();
  });

  test("an action with evidence shows its effect as a range; one without says so and shows no number", () => {
    renderActions();
    expect(screen.getByRole("article", { name: /reminders/i })).toHaveTextContent(
      /Evidence shows 21,5–43 % fewer missed visits/,
    );
    const named = screen.getByRole("article", { name: /Named coordinator/ });
    expect(within(named).getByText("No effect estimate")).toBeInTheDocument();
    expect(named.textContent).not.toMatch(/\d+\s?%/);
  });

  test("offers no dial: nothing here is simulated or decided", () => {
    renderActions();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  test("says so when the Action Library has nothing for the group", () => {
    renderActions([]);
    expect(screen.getByText(/No action in the Action Library fits this group yet/)).toBeInTheDocument();
  });
});

describe("insight card", () => {
  test("asks for the card and the summary of the group named in the address", async () => {
    renderCard();
    await screen.findByRole("heading", { level: 1 });
    const ref = { county: "Western Uusimaa", dimension: "age", group: "85+" };
    expect(mocked.insight).toHaveBeenCalledWith(ref);
    expect(mocked.summary).toHaveBeenCalledWith(ref);
  });

  test("states what, where and who with the group's share, and the Cause Codes as synthetic shares", async () => {
    renderCard();
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Missed first visits");
    const gap = screen.getByRole("group", { name: "Gap" });
    expect(gap).toHaveTextContent("Where: Western Uusimaa");
    expect(gap).toHaveTextContent("Who: People aged 85 and over");
    expect(gap).toHaveTextContent("30 %");
    expect(gap).toHaveTextContent("n=105");
    expect(gap).toHaveTextContent("county 54 %");
    expect(within(gap).getByText("Synthetic")).toBeInTheDocument();
    expect(within(gap).queryByText(/small sample/i)).not.toBeInTheDocument();
    const causes = screen.getByRole("group", { name: /cause codes/i });
    expect(within(causes).getByText("Synthetic")).toBeInTheDocument();
    expect(causes).toHaveTextContent("46 %");
    expect(causes).toHaveTextContent("Visit not confirmed");
    expect(causes).toHaveTextContent("No transport to the visit");
    expect(causes).toHaveTextContent(/waiting for a slot/i);
  });

  test("flags a small sample on the group's share", async () => {
    renderCard(SUMMARY, { ...CARD, baseline: { pct_within_target: 43.8, n: 8, small_sample: true } });
    const gap = await screen.findByRole("group", { name: "Gap" });
    expect(within(gap).getByText(/small sample/i)).toBeInTheDocument();
  });

  test("every summary sentence links to the fact it came from", async () => {
    renderCard();
    const summary = await screen.findByRole("region", { name: /AI summary/i });
    const links = await within(summary).findAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["#fact-group_pct", "https://example.org/43"]);
    expect(within(summary).getByText(/fixed rules/i)).toBeInTheDocument(); // rule-built source is disclosed
  });

  test("a summary the AI model wrote ahead of time says so", async () => {
    renderCard({ ...SUMMARY, source: "pregenerated" });
    const summary = await screen.findByRole("region", { name: /AI summary/i });
    expect(await within(summary).findByText(/AI model.*ahead of time/i)).toBeInTheDocument();
    expect(within(summary).queryByText(/not available/i)).not.toBeInTheDocument();
  });

  test("lays out Cause Codes, summary and recommended actions in that order, with no decision or simulation", async () => {
    renderCard();
    await screen.findByRole("region", { name: /AI summary/i });
    const headings = Array.from(document.querySelectorAll("h2")).map((h) => h.textContent);
    expect(headings).toEqual(["Cause Codes", "AI summary", "Recommended actions"]);
    expect(document.body.textContent).not.toMatch(/decision|simulat/i);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("says when the card cannot be loaded and offers the way back", async () => {
    mocked.insight.mockRejectedValue(new Error("404"));
    mocked.summary.mockRejectedValue(new Error("404"));
    render(
      <MemoryRouter initialEntries={["/dashboard/county/Western%20Uusimaa/insight?dimension=age&group=none"]}>
        <Routes>
          <Route path="/dashboard/county/:name/insight" element={<InsightCard />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(/Could not load this Insight Card/);
    expect(screen.getByRole("link", { name: /Western Uusimaa/ })).toBeInTheDocument();
  });
});
