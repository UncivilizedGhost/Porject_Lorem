// Owner: person 2 — header on every companion screen: Aa (settings, incl. language)
// · Help ("Who to call", one tap from everywhere). Back on flow screens only.
// Screen reader toggle: click anywhere on screen to have it read out loud.
import { Link } from "react-router-dom";

import { useVoice } from "../voice/VoiceProvider";
import { useI18n } from "../i18n/LanguageProvider";
import { BackButton } from "./BackButton";
import { Icon } from "../components/Icon";

export function Header() {
  const { toggleScreenReader, settings } = useVoice();
  const { t } = useI18n();
  const screenReader = settings.screen_reader;
  return (
    <header className="app-header">
      <BackButton />
      <span className="header-spacer" />
      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          onClick={toggleScreenReader}
          aria-pressed={screenReader}
          aria-label={screenReader ? t("voice.screenReaderOff") : t("voice.screenReaderOn")}
        >
          {screenReader ? <Icon name="speaker" size={22} /> : <Icon name="speaker-slash" size={22} />}
        </button>
        <Link className="icon-button aa" to="/settings" aria-label={t("common.settings")}>
          <Icon name="settings" size={22} />
        </Link>
        <Link className="help-pill" to="/help">
          <Icon name="help-pill" size={18} />
          {t("common.help")}
        </Link>
      </div>
    </header>
  );
}