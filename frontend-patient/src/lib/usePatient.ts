import { useCallback } from "react";

import { api } from "../api/client";
import type { PatientView, TrustedView } from "../api/types";
import { getSession, setSession } from "./session";
import { usePolling } from "./usePolling";

/** The signed-in Patient's id. A Contact becomes a Patient when the nurse's call-back promotes
 * them (or the Coordinator does), so a Contact session follows `promoted_patient_id` and keeps it. */
async function currentPatientId(): Promise<string | null> {
  const s = getSession();
  if (s?.patientId) return s.patientId;
  if (!s?.contactId) return null;
  const contact = await api.getContact(s.contactId);
  if (!contact.promoted_patient_id) return null;
  setSession({ ...s, patientId: contact.promoted_patient_id });
  return contact.promoted_patient_id;
}

/** The signed-in Patient, refetched when the demo bar advances the day. `null`: not a Patient yet;
 * `undefined`: still loading. */
export function usePatient(): PatientView | null | undefined {
  const fetcher = useCallback(async () => {
    const id = await currentPatientId();
    return id ? api.getPatient(id) : null;
  }, []);
  return usePolling(fetcher, 8000);
}

/** The trusted view (no clinical content) for the Patient a Trusted Person acts for. */
export function useTrustedView(): TrustedView | null | undefined {
  const fetcher = useCallback(async () => {
    const id = await currentPatientId();
    return id ? api.trustedView(id) : null;
  }, []);
  return usePolling(fetcher, 8000);
}

/** What both roles may see: a Trusted Person only ever fetches the trusted view. */
export function useNextStepView(): Pick<PatientView, "next_step" | "status"> | null | undefined {
  const fetcher = useCallback(async (): Promise<Pick<PatientView, "next_step" | "status"> | null> => {
    const id = await currentPatientId();
    if (!id) return null;
    return getSession()?.role === "trusted_person" ? api.trustedView(id) : api.getPatient(id);
  }, []);
  return usePolling(fetcher, 8000);
}
