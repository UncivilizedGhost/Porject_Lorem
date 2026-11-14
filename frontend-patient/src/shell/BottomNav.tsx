// Owner: person 2 — Home · Pathway · Medicines · Learn, icon + label, active tab as a filled
// pill behind the icon (app/home.html). Contacts get Learn too.
import { NavLink } from "react-router-dom";

import { useI18n } from "../i18n/LanguageProvider";
import type { MessageKey } from "../i18n/dict";

const tabs: { to: string; key: MessageKey; icon: React.ReactNode }[] = [
  {
    to: "/home",
    key: "nav.home",
    icon: (
      <path d="M3.5 10L11 4l7.5 6v8h-5v-5h-5v5h-5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    ),
  },
  {
    to: "/pathway",
    key: "nav.pathway",
    icon: (
      <>
        <circle cx="6" cy="5" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="6" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M6 7v8M11 5h8M11 17h8M11 11h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
  },
  {
    to: "/medicines",
    key: "nav.medicines",
    icon: (
      <>
        <rect x="3" y="8" width="16" height="7" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.7" transform="rotate(-35 11 11.5)" />
        <path d="M8.5 7.5l5 7" stroke="currentColor" strokeWidth="1.7" />
      </>
    ),
  },
  {
    to: "/learn",
    key: "nav.learn",
    icon: (
      <>
        <path
          d="M3 5.5c3-1 5.5-.5 8 1.5 2.5-2 5-2.5 8-1.5v12c-3-1-5.5-.5-8 1.5-2.5-2-5-2.5-8-1.5z"
          fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
        />
        <path d="M11 7v12" stroke="currentColor" strokeWidth="1.7" />
      </>
    ),
  },
];

export function BottomNav() {
  const { t } = useI18n();
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
