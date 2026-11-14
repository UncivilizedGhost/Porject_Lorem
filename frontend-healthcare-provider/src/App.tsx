import { Route, Routes } from "react-router-dom";

import { CountyView } from "./features/dashboard/CountyView";
import { InsightCard } from "./features/dashboard/InsightCard";
import { NationalOverview } from "./features/dashboard/NationalOverview";
import { SimLogScreen } from "./features/simlog/SimLogScreen";
import { BookingScreen } from "./features/worklist/Booking/BookingScreen";
import { SymptomReportCard } from "./features/worklist/SymptomReportCard";
import { WorklistScreen } from "./features/worklist/WorklistScreen";
import { AppShell } from "./shell/AppShell";
import { LoginScreen } from "./shell/LoginScreen";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route element={<AppShell />}>
        {/* person 3 */}
        <Route path="/worklist" element={<WorklistScreen />} />
        <Route path="/worklist/alerts/:alertId" element={<SymptomReportCard />} />
        <Route path="/worklist/book/:rowId" element={<BookingScreen />} />
        {/* person 1 */}
        <Route path="/dashboard" element={<NationalOverview />} />
        <Route path="/dashboard/county/:name" element={<CountyView />} />
        <Route path="/dashboard/county/:name/insight/:cardSlug" element={<InsightCard />} />
        {/* person 4 */}
        <Route path="/sim-log" element={<SimLogScreen />} />
      </Route>
    </Routes>
  );
}
