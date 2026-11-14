// Owner: person 2 — .scratch/patient-companion/spec.md ("App and stack" → shared shell)
// Order: DemoBar · Header (Read aloud · Aa · Help, Back on flow screens) · content ·
// hold-to-talk slot (person 4, shown when Voice Mode is on) · BottomNav.
import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { api } from "../api/client";
import type { Accessibility } from "../api/types";
import { applyAccessibility } from "../lib/applyAccessibility";
import { getSession } from "../lib/session";
import { HoldToTalkButton } from "../voice/HoldToTalkButton";
import { BottomNav } from "./BottomNav";
import { DemoBar } from "./DemoBar";
import { Header } from "./Header";

/** Saved text size and contrast follow the person onto every screen. A Trusted Person only
 * ever reads the trusted view. */
function useSavedAccessibility() {
  useEffect(() => {
    const s = getSession();
    let load: Promise<{ accessibility?: Accessibility }> | undefined;
    if (s?.role === "trusted_person" && s.patientId) load = api.trustedView(s.patientId);
    else if (s?.patientId) load = api.getPatient(s.patientId);
    else if (s?.contactId) load = api.getContact(s.contactId);
    load?.then((r) => r.accessibility && applyAccessibility(r.accessibility)).catch(() => undefined);
  }, []);
}

export function AppShell() {
  useSavedAccessibility();
  return (
    <>
      <DemoBar />
      <Header />
      <main>
        <Outlet />
      </main>
      <HoldToTalkButton />
      <BottomNav />
    </>
  );
}
