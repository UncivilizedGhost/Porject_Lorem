// Sits in the top-right corner under the demo bar, apart from the demo-only controls.
import { useNavigate } from "react-router-dom";

import { clearSession, getSession } from "../lib/session";

export function LogoutButton() {
  const navigate = useNavigate();
  if (!getSession()) return null;
  const logout = () => {
    clearSession();
    navigate("/");
  };
  return (
    <div className="logout-corner">
      <button type="button" onClick={logout}>Log out</button>
    </div>
  );
}
