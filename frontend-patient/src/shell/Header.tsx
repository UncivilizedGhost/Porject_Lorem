// Owner: person 2 — header on every companion screen: Aa (settings, incl. language)
// · Help ("Who to call", one tap from everywhere). Back on flow screens only.
// Voice assistant toggle: click anywhere on screen to have it read out loud.
import { Link, useLocation, useNavigate } from "react-router-dom";

import { clearSession, getSession } from "../lib/session";
import { useVoice } from "../voice/VoiceProvider";
import { useI18n } from "../i18n/LanguageProvider";
import { BackButton } from "./BackButton";
import { Icon } from "../components/Icon";

export function Header() {
  const { toggleVoiceAssistant, settings } = useVoice();
  const { t } = useI18n();
  const voiceAssistant = settings.voice_assistant;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const logout = () => {
    clearSession();
    navigate("/");
  };
  return (
    <header className="app-header">
      <BackButton />
      <span className="header-spacer" />
      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          onClick={toggleVoiceAssistant}
          aria-pressed={voiceAssistant}
          aria-label={voiceAssistant ? t("voice.assistantOff") : t("voice.assistantOn")}
        >
          {voiceAssistant ? <Icon name="speaker" size={22} /> : <Icon name="speaker-slash" size={22} />}
        </button>
        <Link className="icon-button aa" to="/settings" aria-label={t("common.settings")}>
          <Icon name="settings" size={22} />
        </Link>
        <Link className="help-pill" to="/help">
          <Icon name="help-pill" size={18} />
          {t("common.help")}
        </Link>
        {getSession() && pathname !== "/" && (
          <button type="button" className="help-pill" onClick={logout}>
            {t("demo.logout")}
          </button>
        )}
      </div>
    </header>
  );
}