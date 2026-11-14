// A multi-step flow (symptom report) keeps one URL while it moves between screens, so the header's
// Back cannot use history there: that would leave the flow instead of undoing the last step. The
// flow registers its own step-back handler; Back prefers it and only falls back to history.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Register = (fn: (() => void) | null) => void;

interface FlowBackValue {
  handler: (() => void) | null;
  register: Register;
}

const FlowBackContext = createContext<FlowBackValue>({ handler: null, register: () => undefined });

export function FlowBackProvider({ children }: { children: ReactNode }) {
  const [handler, setHandler] = useState<(() => void) | null>(null);
  // Wrapped in a thunk: setHandler(fn) would call the handler as an updater.
  const register = useCallback<Register>((fn) => setHandler(() => fn), []);
  const value = useMemo(() => ({ handler, register }), [handler, register]);
  return <FlowBackContext.Provider value={value}>{children}</FlowBackContext.Provider>;
}

/** The step-back handler the current flow registered; null means "use history". */
export function useFlowBackHandler(): (() => void) | null {
  return useContext(FlowBackContext).handler;
}

/** Registers the flow's Back for as long as the caller is mounted. */
export function useFlowBack(fn: (() => void) | null) {
  const { register } = useContext(FlowBackContext);
  useEffect(() => {
    register(fn);
    return () => register(null);
  }, [fn, register]);
}
