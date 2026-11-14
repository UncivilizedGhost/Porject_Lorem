// Owner: person 2 — Home · Pathway · Medicines · Learn, icon + label, active tab as a filled
// pill behind the icon (app/home.html). Contacts get Learn too.
import { NavLink } from "react-router-dom";

const tabs = [
  {
    to: "/home",
    label: "Home",
    icon: (
      <path d="M3.5 10L11 4l7.5 6v8h-5v-5h-5v5h-5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    ),
  },
  {
    to: "/pathway",
    label: "Pathway",
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
    label: "Medicines",
    icon: (
      <>
        <rect x="3" y="8" width="16" height="7" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.7" transform="rotate(-35 11 11.5)" />
        <path d="M8.5 7.5l5 7" stroke="currentColor" strokeWidth="1.7" />
      </>
    ),
  },
  {
    to: "/learn",
    label: "Learn",
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
  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to}>
          <span className="tab-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" focusable="false">{t.icon}</svg>
          </span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
