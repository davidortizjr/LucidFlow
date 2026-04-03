import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type { NavItem } from "../../types";

export default function SideNavBar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems: NavItem[] = [
    { icon: "dashboard", label: "Dashboard", to: "/" },
    { icon: "view_kanban", label: "Boards", to: "/boards" },
    { icon: "group", label: "Team", to: "/team" },
    { icon: "mail", label: "Messages", to: "/messages" },
    { icon: "calendar_today", label: "Calendar", to: "/calendar" },
    { icon: "schedule", label: "Time Tracking", to: "/time-tracking" },
    { icon: "description", label: "Code Docs", to: "/code-docs" },
    { icon: "settings", label: "Settings", to: "/settings" },
  ];

  const bottomItems: NavItem[] = [
    { icon: "help", label: "Help", to: "/help" },
    { icon: "logout", label: "Logout", to: "/login" },
  ];

  return (
    <aside className="h-[calc(100vh-3rem)] w-64 fixed left-0 top-12 overflow-y-auto z-50 bg-surface-container-lowest flex flex-col p-4 space-y-2 hidden md:flex">
      <div className="flex items-center gap-3 px-2 py-6 mb-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            architecture
          </span>
        </div>
        <div>
          <h2 className="text-lg font-black text-on-surface font-manrope leading-tight">
            Project Alpha
          </h2>
          <p className="text-xs text-on-surface-variant font-semibold">Internal Team</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 font-manrope text-sm font-semibold",
                isActive
                  ? "bg-primary-fixed text-primary"
                  : "text-on-surface-variant hover:bg-surface-container",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 mt-4 border-t border-outline-variant">
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-manrope text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
          <span className="material-symbols-outlined text-sm">person_add</span>{" "}
          Invite Member
        </button>
      </div>

      <div className="mt-auto space-y-1">
        {bottomItems.map((item) => {
          if (item.label === "Logout") {
            return (
              <button
                key={item.label}
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all font-manrope text-sm font-semibold text-left"
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          }
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all font-manrope text-sm font-semibold"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
