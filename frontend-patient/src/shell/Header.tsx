// Owner: person 2 — header on every companion screen: Read aloud · Aa (settings, incl. language)
// · Help ("Who to call", one tap from everywhere). Back on flow screens only.
// Ported from app/home.html: 48 px circular icon buttons, a dark Help pill, a 56 px back slot.
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useVoice } from "../voice/VoiceProvider";
import { useI18n } from "../i18n/LanguageProvider";
import { useVoiceActions } from "../voice/useVoiceActions";
import { BackButton } from "./BackButton";

function SpeakerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      <path d="M3 9h3.5L11 5.5v11L6.5 13H3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.5 8a4 4 0 010 6M17 5.5a7.5 7.5 0 010 11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

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

export function Header() {
  const { readPage } = useVoice();
  const { t } = useI18n();
  const actions = useMemo(
    () => [{ id: "header:read", label: t("common.readAloud"), synonyms: ["read this page"], run: readPage }],
    [readPage, t],
  );
  useVoiceActions(actions);
  return (
    <header className="app-header">
      <BackButton />
      <span className="header-spacer" />
      <div className="header-actions">
        <button type="button" className="icon-button" onClick={readPage} aria-label={t("common.readAloud")}>
          <SpeakerIcon />
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
