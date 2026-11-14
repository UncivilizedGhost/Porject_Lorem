import { useEffect } from "react";
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
import { useI18n } from "./i18n/LanguageProvider";
import { useVoice, VoiceProvider } from "./voice/VoiceProvider";

/** Read-aloud speaks the page language. VoiceProvider mounts before the language provider sets
 * <html lang>, so it would otherwise keep the browser default (English) for every page. */
function VoiceLanguageSync() {
  const { language } = useI18n();
  const { settings, updateSettings } = useVoice();
  useEffect(() => {
    if (settings.language !== language) updateSettings({ language });
  }, [language, settings.language, updateSettings]);
  return null;
}

export function App() {
  return (
    <VoiceProvider>
      <VoiceLanguageSync />
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
          <Route path="/alarm" element={<ConfirmationScreen />} />
          <Route path="/trusted" element={<TrustedPersonView />} />
        </Route>
        <Route path="/care-plan-card" element={<CarePlanCardPrint />} />
      </Routes>
    </VoiceProvider>
  );
}
