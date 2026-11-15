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
import { pageReadingOrder, speak, stopSpeaking } from "./readAloud";
import { containsRedFlag, SAFETY_MESSAGE } from "./redFlags";
import { STRINGS } from "./strings";
import type { Readable, VoiceAction } from "./types";

export interface VoiceSettings {
  language: "fi" | "sv" | "en";
  read_aloud: boolean;
  voice_mode: boolean;
  screen_reader: boolean;
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
  /** Toggle screen reader on/off. */
  toggleScreenReader: () => Promise<void>;
  /** Read a single element's text aloud. */
  speakElementText: (text: string) => Promise<void>;
}

const DEFAULT_SETTINGS: VoiceSettings = { language: "en", read_aloud: false, voice_mode: false, screen_reader: false, speed: "normal" };

const noop: VoiceContextValue = {
  registerActions: () => () => undefined,
  setReadable: () => () => undefined,
  readPage: () => undefined,
  dictate: async () => null,
  settings: DEFAULT_SETTINGS,
  updateSettings: () => undefined,
  handleTranscript: async () => undefined,
  reportVoiceUnavailable: async () => undefined,
  toggleScreenReader: async () => undefined,
  speakElementText: async () => undefined,
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
    const parts = pageReadingOrder(readableRef.current);
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

  const toggleScreenReader = useCallback(async () => {
    const t = STRINGS[settingsRef.current.language] ?? STRINGS.en;
    const next = !settingsRef.current.screen_reader;
    setSettings((s) => {
      const updated = { ...s, screen_reader: next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
    if (next) {
      await say(t.screenReaderOn);
    } else {
      await say(t.screenReaderOff);
    }
  }, [say]);

  const speakElementText = useCallback(async (text: string) => {
    await say(text);
  }, [say]);

  // Global click-to-read: when screen reader is on, clicking on any element reads it aloud.
  // Uses pointerup (fires immediately on touch, no 300 ms double-tap delay) with click as a
  // fallback. Walks up from the clicked target so icons inside buttons still read the button's
  // text. Form controls are excluded so they still work normally.
  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!settings.screen_reader) return;
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select")) return; // let form controls work normally
    if (target.closest('[data-voice-read="false"]')) return; // exclude buttons that must not be read aloud
    const readable = findReadableElement(target);
    if (readable) {
      void say(readable);
    }
  }, [settings.screen_reader, say]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!settings.screen_reader) return;
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select")) return;
    if (target.closest('[data-voice-read="false"]')) return;
    const readable = findReadableElement(target);
    if (readable) {
      void say(readable);
    }
  }, [settings.screen_reader, say]);

  /** Walk up from the clicked node to find the nearest element with readable text. */
  function findReadableElement(node: HTMLElement): string | null {
    let element: HTMLElement | null = node;
    const root = document.documentElement;
    while (element && element !== root) {
      // For buttons, prioritize aria-label (what the button does) over text content
      if (element.tagName === "BUTTON") {
        const text = element.getAttribute("aria-label") || element.textContent?.trim() || "";
        if (text) return text;
      } else {
        const text =
          element.getAttribute("aria-label") ||
          element.textContent?.trim() ||
          element.getAttribute("aria-valuetext") ||
          "";
        if (text) return text;
      }
      element = element.parentElement;
    }
    return null;
  }

  useEffect(() => {
    if (!settings.screen_reader) return;
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("click", handleClick);
    };
  }, [settings.screen_reader, handlePointerUp, handleClick]);

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
      toggleScreenReader,
      speakElementText,
    }),
    [registerActions, setReadable, readPage, dictate, settings, updateSettings, handleTranscript, reportVoiceUnavailable, toggleScreenReader, speakElementText],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  return useContext(VoiceContext);
}
