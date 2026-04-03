import { NavLink } from "react-router-dom";
import type { MobileNavItem } from "../../types";

export default function MobileNavBar() {
  const navItems: MobileNavItem[] = [
    { icon: "dashboard", label: "Home", to: "/", end: true },
    { icon: "view_kanban", label: "Boards", to: "/boards" },
    { icon: "group", label: "Team", to: "/team" },
    { icon: "calendar_today", label: "Events", to: "/calendar" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-surface-container-lowest backdrop-blur-md z-40 flex justify-around items-center h-16 border-t-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            ["flex flex-col items-center justify-center", isActive ? "text-primary" : "text-slate-500"].join(
              " "
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className={["text-[10px]", isActive ? "font-bold" : "font-medium"].join(" ")}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
