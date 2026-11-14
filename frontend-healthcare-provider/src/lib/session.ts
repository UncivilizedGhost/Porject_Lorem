// Role chosen on the login screen (ADR-0004). Coordinator id from GET /demo/identities.
export type Role = "coordinator" | "county_viewer";

export interface Session { role: Role; coordinatorId?: string }

const KEY = "provider.session";

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
    /* ignore */
  }
}
