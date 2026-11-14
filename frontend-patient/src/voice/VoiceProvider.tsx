// Owner: person 4 — provider at the app root: language, read_aloud, voice_mode, speed from the
// person's accessibility settings; the current screen's registered actions; the "voice context"
// flag the API client reads to set input: "voice".
//
// Screens use the hooks (useVoiceActions, useReadable) and `dictate`; person 2's Settings screen
// can call `updateSettings({ language, read_aloud, voice_mode, speed })`.
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { match } from "./matcher";
import { readingOrder, speak, stopSpeaking } from "./readAloud";
import { containsRedFlag, SAFETY_MESSAGE } from "./redFlags";
import { STRINGS } from "./strings";
import type { Readable, VoiceAction } from "./types";

export interface VoiceSettings {
  language: "fi" | "sv" | "en";
  read_aloud: boolean;
  voice_mode: boolean;
  speed: "normal" | "slow";
}

interface VoiceContextValue {
  registerActions: (actions: VoiceAction[]) => () => void;
  setReadable: (r: Readable) => () => void;
  readPage: () => void;
  dictate: (opts: { prompt: string }) => Promise<string | null>;
  // Added by the voice layer (backward compatible):
  settings: VoiceSettings;
  updateSettings: (patch: Partial<VoiceSettings>) => void;
  /** Feed a transcript (from /voice/stt) through the matcher and the read-back flow. */
  handleTranscript: (transcript: string) => Promise<void>;
  /** Tell the person (aloud) that speech input failed, so they use the buttons. */
  reportVoiceUnavailable: () => Promise<void>;
}

const DEFAULT_SETTINGS: VoiceSettings = { language: "en", read_aloud: false, voice_mode: false, speed: "normal" };

const noop: VoiceContextValue = {
  registerActions: () => () => undefined,
  setReadable: () => () => undefined,
  readPage: () => undefined,
  dictate: async () => null,
  settings: DEFAULT_SETTINGS,
  updateSettings: () => undefined,
  handleTranscript: async () => undefined,
  reportVoiceUnavailable: async () => undefined,
};

const VoiceContext = createContext<VoiceContextValue>(noop);

let runningVoiceAction = false;

/** Read by api/client.ts on every write. */
export function voiceInputMode(): "touch" | "voice" {
  return runningVoiceAction ? "voice" : "touch";
}

const STORAGE_KEY = "pathway.voice.settings";

function loadSettings(initial?: Partial<VoiceSettings>): VoiceSettings {
  let stored: Partial<VoiceSettings> = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    /* private window etc. */
  }
  const docLang = typeof document !== "undefined" ? document.documentElement.lang : "";
  const fromDoc = ["fi", "sv", "en"].includes(docLang) ? { language: docLang as VoiceSettings["language"] } : {};
  return { ...DEFAULT_SETTINGS, ...fromDoc, ...stored, ...initial };
}

type Pending =
  | { kind: "action"; action: VoiceAction; value?: number }
  | { kind: "dictation-capture"; resolve: (t: string | null) => void }
  | { kind: "dictation-confirm"; text: string; resolve: (t: string | null) => void };

export function VoiceProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings?: Partial<VoiceSettings>;
}) {
  const [settings, setSettings] = useState<VoiceSettings>(() => loadSettings(initialSettings));
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const actionsRef = useRef<VoiceAction[]>([]);
  const readableRef = useRef<Readable>({});
  const readableSig = useRef<string>("");
  const pending = useRef<Pending | null>(null);
  const lastSpoken = useRef<string>("");
  const readToken = useRef(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSettings = useCallback((patch: Partial<VoiceSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const say = useCallback(async (text: string) => {
    readToken.current += 1;
    stopSpeaking();
    lastSpoken.current = text;
    const { language, speed } = settingsRef.current;
    await speak(text, language, speed);
  }, []);

  const readPage = useCallback(() => {
    const token = ++readToken.current;
    stopSpeaking();
    const parts = readingOrder(readableRef.current);
    void (async () => {
      for (const part of parts) {
        if (token !== readToken.current) return;
        await speak(part, settingsRef.current.language, settingsRef.current.speed);
      }
    })();
  }, []);

  const registerActions = useCallback((actions: VoiceAction[]) => {
    actionsRef.current = actions;
    return () => {
      if (actionsRef.current === actions) actionsRef.current = [];
    };
  }, []);

  const setReadable = useCallback(
    (r: Readable) => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = null;
      readableRef.current = r;
      const sig = JSON.stringify(r);
      const changed = sig !== readableSig.current;
      readableSig.current = sig;
      if (changed && settingsRef.current.read_aloud) readPage();
      return () => {
        // A re-render with identical content re-runs the effect: only treat it as leaving the
        // screen when no new content arrives straight away.
        clearTimer.current = setTimeout(() => {
          readableRef.current = {};
          readableSig.current = "";
          readToken.current += 1;
          stopSpeaking();
        }, 0);
      };
    },
    [readPage],
  );

  const handleTranscript = useCallback(
    async (transcript: string) => {
      const { language } = settingsRef.current;
      const t = STRINGS[language] ?? STRINGS.en;

      if (containsRedFlag(transcript, language)) {
        await say(SAFETY_MESSAGE[language] ?? SAFETY_MESSAGE.en);
      }

      const waiting = pending.current;

      if (waiting?.kind === "dictation-capture") {
        pending.current = { kind: "dictation-confirm", text: transcript, resolve: waiting.resolve };
        await say(t.youSaid(transcript));
        return;
      }

      if (waiting?.kind === "dictation-confirm") {
        const m = match(transcript, [], language);
        if (m.kind === "global" && m.word === "yes") {
          pending.current = null;
          waiting.resolve(waiting.text);
        } else if (m.kind === "global" && m.word === "no") {
          pending.current = null;
          waiting.resolve(null);
          await say(t.cancelled);
        } else {
          await say(t.youSaid(waiting.text));
        }
        return;
      }

      const actions = actionsRef.current;
      const m = match(transcript, waiting?.kind === "action" ? [] : actions, language);

      if (waiting?.kind === "action") {
        if (m.kind === "global" && m.word === "yes") {
          pending.current = null;
          runningVoiceAction = true;
          try {
            await waiting.action.run(waiting.value);
          } finally {
            runningVoiceAction = false;
          }
          return;
        }
        if (m.kind === "global" && m.word === "no") {
          pending.current = null;
          await say(t.cancelled);
          return;
        }
        // Anything else leaves the question open and asks again.
        await say(lastSpoken.current || t.sayYesOrNo);
        return;
      }

      if (m.kind === "action") {
        pending.current = { kind: "action", action: m.action, value: m.value };
        const question =
          m.action.confirm_text ?? (m.value !== undefined ? `${m.action.label} ${m.value}?` : `${m.action.label}?`);
        await say(`${question} ${t.sayYesOrNo}`);
        return;
      }

      if (m.kind === "global") {
        if (m.word === "repeat") {
          await say(lastSpoken.current || t.nothingToRepeat);
        } else if (m.word === "back") {
          window.history.back();
        } else if (m.word === "call_nurse") {
          const nurse = actions.find((a) => a.id === "call_nurse");
          if (nurse) {
            pending.current = { kind: "action", action: nurse };
            await say(`${nurse.confirm_text ?? `${nurse.label}?`} ${t.sayYesOrNo}`);
          } else {
            window.history.pushState({}, "", "/help");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
        } else if (m.word === "help") {
          await say(`${t.helpIntro} ${actions.map((a) => a.label).join(", ")}`);
        }
        return;
      }

      await say(`${t.didntCatch} ${actions.map((a) => a.label).join(", ")}`);
    },
    [say],
  );

  const dictate = useCallback(
    ({ prompt }: { prompt: string }) =>
      new Promise<string | null>((resolve) => {
        pending.current = { kind: "dictation-capture", resolve };
        void say(prompt);
      }),
    [say],
  );

  const reportVoiceUnavailable = useCallback(async () => {
    const t = STRINGS[settingsRef.current.language] ?? STRINGS.en;
    await say(t.unavailable);
  }, [say]);

  useEffect(
    () => () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    },
    [],
  );

  const value = useMemo<VoiceContextValue>(
    () => ({
      registerActions,
      setReadable,
      readPage,
      dictate,
      settings,
      updateSettings,
      handleTranscript,
      reportVoiceUnavailable,
    }),
    [registerActions, setReadable, readPage, dictate, settings, updateSettings, handleTranscript, reportVoiceUnavailable],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  return useContext(VoiceContext);
}
