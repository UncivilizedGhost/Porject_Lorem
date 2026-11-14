// Owner: person 2 — header on every companion screen: Aa (settings, incl. language)
// · Help ("Who to call", one tap from everywhere). Back on flow screens only.
// Voice assistant toggle: hold anywhere on screen to have it read out loud.
import { Link } from "react-router-dom";

import { useVoice } from "../voice/VoiceProvider";
import { useI18n } from "../i18n/LanguageProvider";
import { BackButton } from "./BackButton";

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M5 3h3l1.5 4-2 1.2a9 9 0 004.3 4.3l1.2-2 4 1.5v3a1.5 1.5 0 01-1.6 1.5A14 14 0 013.5 4.6 1.5 1.5 0 015 3z"
        fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      <path d="M3 9h3.5L11 5.5v11L6.5 13H3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.5 8a4 4 0 010 6M17 5.5a7.5 7.5 0 010 11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 8L14 14M14 8L8 14" fill="none" stroke="currentColor" strokeWidth="1.7" stroke-linecap="round" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      <path d="M3 9h3.5L11 5.5v11L6.5 13H3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.5 8a4 4 0 010 6M17 5.5a7.5 7.5 0 010 11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function Header() {
  const { toggleVoiceAssistant, settings } = useVoice();
  const { t } = useI18n();
  const voiceAssistant = settings.voice_assistant;
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
          {voiceAssistant ? <SpeakerOffIcon /> : <SpeakerIcon />}
        </button>
        <Link className="icon-button aa" to="/settings" aria-label={t("common.settings")}>Aa</Link>
        <Link className="help-pill" to="/help">
          <HelpIcon />
          {t("common.help")}
        </Link>
      </div>
    </header>
  );
}