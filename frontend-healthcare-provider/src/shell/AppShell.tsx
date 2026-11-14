// Owner: person 1 — .scratch/equity-dashboard/spec.md ("Provider app"). Demo bar on every
// route; person 3 and person 4 add their routes in App.tsx, nothing else.
import { Outlet } from "react-router-dom";

import { DemoBar } from "./DemoBar";

export function AppShell() {
  return (
    <>
      <DemoBar />
      <main>
        <Outlet />
      </main>
    </>
  );
}
