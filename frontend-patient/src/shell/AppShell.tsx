// Owner: person 2 — .scratch/patient-companion/spec.md ("App and stack" → shared shell)
// Order: DemoBar · Header (Aa · Help, Back on flow screens) · content · hold-to-talk
// slot (person 4, shown when Voice Mode is on) · BottomNav, all inside the phone frame from
// app/home.html so the app looks like the artboards on any screen size.
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { api } from "../api/client";
import type { Accessibility } from "../api/types";
import { applyAccessibility } from "../lib/applyAccessibility";
import { getSession } from "../lib/session";
import { HoldToTalkButton } from "../voice/HoldToTalkButton";
import { BottomNav } from "./BottomNav";
import { DemoBar } from "./DemoBar";
import { FlowBackProvider } from "./FlowBack";
import { Header } from "./Header";
import { PageToneProvider, usePageTone } from "./PageTone";

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

/** Screens written for the patient. A Trusted Person is sent to their own view instead. */
const PATIENT_ONLY = ["/home", "/pathway", "/medicines"];

/** Reachable before a role is chosen: the header's Aa and Help buttons open these, and the
 * emergency numbers / text size are needed to make that choice. */
const OPEN_WITHOUT_ROLE = ["/settings", "/help"];

function Frame() {
  const tone = usePageTone();
  const { pathname } = useLocation();
  const session = getSession();
  // The role is chosen on the login screen. No role at all means this page was opened directly,
  // unless it is one of the two screens the login page's own header can open.
  if (!session && !OPEN_WITHOUT_ROLE.includes(pathname)) return <Navigate to="/" replace />;
  if (
    session?.role === "trusted_person" &&
    PATIENT_ONLY.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return <Navigate to="/trusted" replace />;
  }
  return (
    <div className="app-frame" data-tone={tone ?? undefined}>
      <DemoBar />
      <Header />
      <main>
        <Outlet />
      </main>
      <HoldToTalkButton />
      <BottomNav />
    </div>
  );
}

export function AppShell() {
  useSavedAccessibility();
  return (
    <PageToneProvider>
      <FlowBackProvider>
        <Frame />
      </FlowBackProvider>
    </PageToneProvider>
  );
}
