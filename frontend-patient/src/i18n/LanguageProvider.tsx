// The page language. The Language tiles on Settings switch it, the choice is remembered in
// localStorage (the demo has no login to carry it), and every screen reads it through `t()`.
// <html lang> follows so screen readers pronounce the page correctly.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getSession } from "../lib/session";
import { translate, type MessageKey, type UiLanguage } from "./dict";

const STORAGE_KEY = "pathway.language";

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

interface LanguageValue {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  t: Translate;
}

const LanguageContext = createContext<LanguageValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (key, vars) => translate("en", key, vars),
});

function storedLanguage(): UiLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "fi" || saved === "sv" || saved === "en") return saved;
  } catch {
    /* private window etc. */
  }
  const spoken = typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "en";
  return spoken === "fi" || spoken === "sv" ? spoken : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>(storedLanguage);

  const setLanguage = useCallback((next: UiLanguage) => setLanguageState(next), []);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* ignore */
    }
  }, [language]);

  // The role comes from the login tiles: a Trusted Person gets "<key>.trusted" where one exists.
  const t = useCallback<Translate>(
    (key, vars) => translate(language, key, vars, getSession()?.role ?? "patient"),
    [language],
  );
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageValue {
  return useContext(LanguageContext);
}
