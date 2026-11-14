import { Route, Routes } from "react-router-dom";

import { AppShell } from "./shell/AppShell";
import { CarePlanCardPrint } from "./screens/CarePlanCard/CarePlanCardPrint";
import { CheckInFlow } from "./screens/CheckIn/CheckInFlow";
import { ConfirmationScreen } from "./screens/Confirmation/ConfirmationScreen";
import { HelpScreen } from "./screens/Help/HelpScreen";
import { HomeScreen } from "./screens/Home/HomeScreen";
import { LearnScreen } from "./screens/Learn/LearnScreen";
import { LoginScreen } from "./screens/Login/LoginScreen";
import { MedicinesScreen } from "./screens/Medicines/MedicinesScreen";
import { PathwayScreen } from "./screens/Pathway/PathwayScreen";
import { RiskCheckFlow } from "./screens/RiskCheck/RiskCheckFlow";
import { SettingsScreen } from "./screens/Settings/SettingsScreen";
import { SymptomReportFlow } from "./screens/SymptomReport/SymptomReportFlow";
import { TrustedPersonView } from "./screens/TrustedPerson/TrustedPersonView";
import { WarningSignsScreen } from "./screens/WarningSigns/WarningSignsScreen";
import { VoiceProvider } from "./voice/VoiceProvider";

export function App() {
  return (
    <VoiceProvider>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route element={<AppShell />}>
          <Route path="/risk-check/*" element={<RiskCheckFlow />} />
          <Route path="/warning-signs" element={<WarningSignsScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/pathway" element={<PathwayScreen />} />
          <Route path="/confirm/:stepId" element={<ConfirmationScreen />} />
          <Route path="/check-in/*" element={<CheckInFlow />} />
          <Route path="/medicines" element={<MedicinesScreen />} />
          <Route path="/learn" element={<LearnScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/help" element={<HelpScreen />} />
          <Route path="/report/*" element={<SymptomReportFlow />} />
          <Route path="/trusted" element={<TrustedPersonView />} />
        </Route>
        <Route path="/care-plan-card" element={<CarePlanCardPrint />} />
      </Routes>
    </VoiceProvider>
  );
}
