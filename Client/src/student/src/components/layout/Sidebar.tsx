import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/student/dashboard", label: "Dashboard" },
  { to: "/student/project", label: "My Project" },
  { to: "/student/feedback", label: "Feedback" },
  { to: "/student/meetings", label: "Meetings" },
  { to: "/student/progress", label: "Progress" },
  { to: "/messages", label: "Messages" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
      <div className="flex h-16 items-center border-b border-gray-100 px-5">
        <span className="text-lg font-semibold text-brand-700">SPMS</span>
        <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          Student
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
