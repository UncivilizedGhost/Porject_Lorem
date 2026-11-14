// Owner: person 2 — Home · Pathway · Medicines · Learn, icon + label, active tab as a filled
// pill. Contacts (phase 0–1) get Learn too.
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/home", label: "Home", icon: "⌂" },
  { to: "/pathway", label: "Pathway", icon: "➜" },
  { to: "/medicines", label: "Medicines", icon: "✚" },
  { to: "/learn", label: "Learn", icon: "?" },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to}>
          <span className="tab-icon" aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
