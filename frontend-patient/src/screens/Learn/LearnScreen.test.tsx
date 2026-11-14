// Owner: person 4 — seam 3: the Learn screen with the API client and the voice service mocked.
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../api/client", () => ({ api: { learnAsk: vi.fn() } }));
vi.mock("../../voice/readAloud", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../voice/readAloud")>()),
  speak: vi.fn(() => Promise.resolve()),
  stopSpeaking: vi.fn(),
}));
vi.mock("../../voice/voiceApi", () => ({ fetchTts: vi.fn(), fetchStt: vi.fn() }));

import { api } from "../../api/client";
import { speak } from "../../voice/readAloud";
import { useVoice, VoiceProvider } from "../../voice/VoiceProvider";
import { LearnScreen } from "./LearnScreen";

const ask = vi.mocked(api.learnAsk);
let voice!: ReturnType<typeof useVoice>;

function Probe() {
  voice = useVoice();
  return null;
}

function renderLearn(language: "fi" | "sv" | "en" = "en") {
  return render(
    <VoiceProvider initialSettings={{ language, voice_mode: true }}>
      <Probe />
      <LearnScreen />
    </VoiceProvider>,
  );
}

const answer = {
  kind: "answer",
  text: "A bronchoscopy looks at your airways with a thin camera.",
  sources: [
    { label: "Syöpätalo (Cancer Hub), Terveyskylä.fi", url: "https://hus.fi/x", passage_id: "bronchoscopy_en" },
  ],
};

beforeEach(() => {
  ask.mockReset();
  vi.mocked(speak).mockClear();
});

test("a suggested question asks Learn and shows the answer with its source", async () => {
  ask.mockResolvedValue(answer);
  renderLearn();
  await userEvent.click(screen.getByRole("button", { name: "What is a bronchoscopy?" }));
  expect(ask).toHaveBeenCalledWith({ question: "What is a bronchoscopy?", language: "en" });
  expect(await screen.findByText(answer.text)).toBeInTheDocument();
  const chip = screen.getByRole("link", { name: /Syöpätalo \(Cancer Hub\), Terveyskylä\.fi/ });
  expect(chip).toHaveAttribute("href", "https://hus.fi/x");
});

test("the question box has a visible label and typing a question asks it", async () => {
  ask.mockResolvedValue(answer);
  renderLearn();
  await userEvent.type(screen.getByLabelText("Your question"), "What is a CT scan?");
  await userEvent.click(screen.getByRole("button", { name: "Ask" }));
  expect(ask).toHaveBeenCalledWith({ question: "What is a CT scan?", language: "en" });
});

test("a safety answer is shown as an alert, not as an explanation", async () => {
  ask.mockResolvedValue({ kind: "safety", text: "Call 112. Or 116 117.", sources: [] });
  renderLearn();
  await userEvent.type(screen.getByLabelText("Your question"), "I'm coughing blood");
  await userEvent.click(screen.getByRole("button", { name: "Ask" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Call 112. Or 116 117.");
  expect(screen.queryByRole("link")).toBeNull();
});

test("no source shows the ask-your-nurse text and no source chip", async () => {
  ask.mockResolvedValue({ kind: "no_source", text: "Ask your nurse: 040 000 0000.", sources: [] });
  renderLearn();
  await userEvent.type(screen.getByLabelText("Your question"), "capital of Mongolia");
  await userEvent.click(screen.getByRole("button", { name: "Ask" }));
  expect(await screen.findByText("Ask your nurse")).toBeInTheDocument();
  expect(screen.queryByRole("link")).toBeNull();
});

test("a server failure points to the nurse instead of leaving a blank screen", async () => {
  ask.mockRejectedValue(new Error("down"));
  renderLearn();
  await userEvent.click(screen.getByRole("button", { name: "What is a bronchoscopy?" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/nurse/i);
});

test("voice assistant toggle works via voice command", async () => {
  renderLearn();
  // Voice command "ask" triggers the learn_ask action which toggles voice assistant
  await act(async () => voice.handleTranscript("ask"));
  await act(async () => voice.handleTranscript("yes"));
  // Voice assistant should now be on
  expect(voice.settings.voice_assistant).toBe(true);
  await act(async () => voice.handleTranscript("ask"));
  await act(async () => voice.handleTranscript("yes"));
  expect(voice.settings.voice_assistant).toBe(false);
});

test("the answer and its source are read aloud", async () => {
  ask.mockResolvedValue(answer);
  renderLearn();
  await userEvent.click(screen.getByRole("button", { name: "What is a bronchoscopy?" }));
  await screen.findByText(answer.text);
  vi.mocked(speak).mockClear();
  await act(async () => voice.readPage());
  await waitFor(() => {
    const said = vi.mocked(speak).mock.calls.map((c) => c[0]).join(" ");
    expect(said).toContain(answer.text);
    expect(said).toContain("Syöpätalo (Cancer Hub), Terveyskylä.fi");
  });
});