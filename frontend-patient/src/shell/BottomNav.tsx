// Owner: person 2 — Home · Pathway · Medicines · Learn, icon + label, active tab as a filled
// pill behind the icon (app/home.html). A Trusted Person gets their own tabs: the patient's Home,
// Pathway and Medicines are not theirs (the shell bounces those routes to /trusted), so their nav
// is Helping, Check-in, Learn, Help.
import { NavLink } from "react-router-dom";

import { useI18n } from "../i18n/LanguageProvider";
import type { MessageKey } from "../i18n/dict";
import { getSession } from "../lib/session";

const HOME_ICON = (
  <path d="M3.5 10L11 4l7.5 6v8h-5v-5h-5v5h-5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
);

const PATHWAY_ICON = (
  <>
    <circle cx="6" cy="5" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="6" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M6 7v8M11 5h8M11 17h8M11 11h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </>
);

const MEDICINES_ICON = (
  <>
    <rect x="3" y="8" width="16" height="7" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.7" transform="rotate(-35 11 11.5)" />
    <path d="M8.5 7.5l5 7" stroke="currentColor" strokeWidth="1.7" />
  </>
);

const LEARN_ICON = (
  <>
    <path
      d="M3 5.5c3-1 5.5-.5 8 1.5 2.5-2 5-2.5 8-1.5v12c-3-1-5.5-.5-8 1.5-2.5-2-5-2.5-8-1.5z"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
    />
    <path d="M11 7v12" stroke="currentColor" strokeWidth="1.7" />
  </>
);

const HELPING_ICON = (
  <path
    d="M11 18.5C7 16 4 13.5 4 10.5a3.5 3.5 0 017-1.5 3.5 3.5 0 017 1.5c0 3-3 5.5-7 8z"
    fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
  />
);

const CHECKIN_ICON = (
  <>
    <rect x="3.5" y="5.5" width="15" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M7.5 3.5v3.5M14.5 3.5v3.5M3.5 9.5h15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M8 14l2 2 4-4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

const HELP_ICON = (
  <path
    d="M7 4h4l2 5-3 2a13 13 0 006 6l2-3 5 2v4a2 2 0 01-2 2A19 19 0 015 6a2 2 0 012-2z"
    fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
  />
);

const PATIENT_TABS: { to: string; key: MessageKey; icon: React.ReactNode }[] = [
  { to: "/home", key: "nav.home", icon: HOME_ICON },
  { to: "/pathway", key: "nav.pathway", icon: PATHWAY_ICON },
  { to: "/medicines", key: "nav.medicines", icon: MEDICINES_ICON },
  { to: "/learn", key: "nav.learn", icon: LEARN_ICON },
];

const TRUSTED_TABS: { to: string; key: MessageKey; icon: React.ReactNode }[] = [
  { to: "/trusted", key: "nav.trusted", icon: HELPING_ICON },
  { to: "/check-in", key: "nav.checkin", icon: CHECKIN_ICON },
  { to: "/learn", key: "nav.learn", icon: LEARN_ICON },
  { to: "/help", key: "nav.help", icon: HELP_ICON },
];

export function BottomNav() {
  const { t } = useI18n();
  // The shell re-renders on navigation, so reading the session here is enough.
  const tabs = getSession()?.role === "trusted_person" ? TRUSTED_TABS : PATIENT_TABS;
  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to}>
          <span className="tab-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" focusable="false">{tab.icon}</svg>
          </span>
          <span>{t(tab.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
