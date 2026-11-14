// Owner: person 2 — Home · Pathway · Medicines · Learn, icon + label, active tab as a filled
// pill. Contacts (phase 0–1) get Learn too.
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/home", label: "Home" },
  { to: "/pathway", label: "Pathway" },
  { to: "/medicines", label: "Medicines" },
  { to: "/learn", label: "Learn" },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
