// Role and demo identity chosen on the login screen (ADR-0004: no real auth).
// Session storage is enough; nothing here is a credential.

export type Role = "patient" | "trusted_person";

export interface Session {
  role: Role;
  contactId?: string;
  patientId?: string;
  trustedPersonName?: string;
}

const KEY = "pathway.session";

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private window etc. */
  }
}

export function actorFields(): { actor: "self" | "trusted_person"; trusted_person_name?: string } {
  const s = getSession();
  return s?.role === "trusted_person"
    ? { actor: "trusted_person", trusted_person_name: s.trustedPersonName }
    : { actor: "self" };
}
