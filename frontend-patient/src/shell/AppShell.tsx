// Owner: person 2 — .scratch/patient-companion/spec.md ("App and stack" → shared shell)
// Order: DemoBar · Header (Read aloud · Aa · Help, Back on flow screens) · content ·
// hold-to-talk slot (person 4, shown when Voice Mode is on) · BottomNav.
import { Outlet } from "react-router-dom";

import { HoldToTalkButton } from "../voice/HoldToTalkButton";
import { BottomNav } from "./BottomNav";
import { DemoBar } from "./DemoBar";
import { Header } from "./Header";

export function AppShell() {
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
