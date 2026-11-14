import { useCallback } from "react";

import { api } from "../api/client";
import type { PatientView, TrustedView } from "../api/types";
import { getSession } from "./session";
import { usePolling } from "./usePolling";

/** The signed-in Patient, refetched when the demo bar advances the day. */
export function usePatient(): PatientView | undefined {
  const patientId = getSession()?.patientId;
  const fetcher = useCallback(() => api.getPatient(patientId ?? ""), [patientId]);
  return usePolling(fetcher, 8000);
}

/** The trusted view (no clinical content) for the Patient a Trusted Person acts for. */
export function useTrustedView(): TrustedView | undefined {
  const patientId = getSession()?.patientId;
  const fetcher = useCallback(() => api.trustedView(patientId ?? ""), [patientId]);
  return usePolling(fetcher, 8000);
}

/** What both roles may see: a Trusted Person only ever fetches the trusted view. */
export function useNextStepView(): Pick<PatientView, "next_step" | "status"> | undefined {
  const isTrusted = getSession()?.role === "trusted_person";
  const patientId = getSession()?.patientId ?? "";
  const fetcher = useCallback(
    (): Promise<Pick<PatientView, "next_step" | "status">> =>
      isTrusted ? api.trustedView(patientId) : api.getPatient(patientId),
    [isTrusted, patientId],
  );
  return usePolling(fetcher, 8000);
}
