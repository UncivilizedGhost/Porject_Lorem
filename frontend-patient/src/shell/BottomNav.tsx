// Owner: person 2 — Home · Pathway · Medicines · Learn, icon + label, active tab as a filled
// pill behind the icon (app/home.html). A Trusted Person gets their own tabs: the patient's Home,
// Pathway and Medicines are not theirs (the shell bounces those routes to /trusted), so their nav
// is Helping, Check-in, Learn, Help.
// Icons come from @phosphor-icons/react.
import { NavLink } from "react-router-dom";

import { Icon } from "../components/Icon";
import { useI18n } from "../i18n/LanguageProvider";
import type { MessageKey } from "../i18n/dict";
import { getSession } from "../lib/session";

const PATIENT_TABS: { to: string; key: MessageKey; icon: "home" | "pathway" | "medicines" | "learn" }[] = [
  { to: "/home", key: "nav.home", icon: "home" },
  { to: "/pathway", key: "nav.pathway", icon: "pathway" },
  { to: "/medicines", key: "nav.medicines", icon: "medicines" },
  { to: "/learn", key: "nav.learn", icon: "learn" },
];

const TRUSTED_TABS: { to: string; key: MessageKey; icon: "helping" | "checkin" | "learn" | "help" }[] = [
  { to: "/trusted", key: "nav.trusted", icon: "helping" },
  { to: "/check-in", key: "nav.checkin", icon: "checkin" },
  { to: "/learn", key: "nav.learn", icon: "learn" },
  { to: "/help", key: "nav.help", icon: "help" },
];

export function BottomNav() {
  const { t } = useI18n();
  const tabs = getSession()?.role === "trusted_person" ? TRUSTED_TABS : PATIENT_TABS;
  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to}>
          <span className="tab-icon" aria-hidden="true">
            <Icon name={tab.icon} size={22} />
          </span>
          <span>{t(tab.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
