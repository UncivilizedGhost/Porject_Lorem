// Two screens are full-page colours in the artboards: Call now (pale red) and Confirm (dark).
// A screen declares its tone; the shell paints the frame and restyles the header chrome.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Tone = "alert" | "dark" | null;

const ToneContext = createContext<{ tone: Tone; setTone: (t: Tone) => void }>({
  tone: null,
  setTone: () => undefined,
});

export function PageToneProvider({ children }: { children: ReactNode }) {
  const [tone, setTone] = useState<Tone>(null);
  const value = useMemo(() => ({ tone, setTone }), [tone]);
  return <ToneContext.Provider value={value}>{children}</ToneContext.Provider>;
}

/** The tone of the frame right now. */
export function usePageTone(): Tone {
  return useContext(ToneContext).tone;
}

/** Sets the frame's tone for as long as the calling screen is mounted. */
export function useTonePage(tone: Tone) {
  const { setTone } = useContext(ToneContext);
  useEffect(() => {
    setTone(tone);
    return () => setTone(null);
  }, [tone, setTone]);
}
