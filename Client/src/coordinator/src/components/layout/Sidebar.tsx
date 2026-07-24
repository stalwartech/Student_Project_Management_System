import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { notificationApi, messageApi } from "@/api/misc";

const NAV_ITEMS = [
  { to: "/coordinator/dashboard", label: "Dashboard" },
  { to: "/coordinator/academic-sessions", label: "Academic Sessions" },
  { to: "/coordinator/students", label: "Students" },
  { to: "/coordinator/supervisors", label: "Supervisors" },
  { to: "/coordinator/import", label: "Bulk Import" },
  { to: "/coordinator/projects", label: "Projects" },
  { to: "/coordinator/allocation", label: "Auto Allocation" },
  { to: "/coordinator/activity", label: "Activity Log" },
  { to: "/coordinator/reports", label: "Reports" },
  { to: "/coordinator/settings", label: "Settings" },
  { to: "/coordinator/messages", label: "Messages", showsMessages: true },
  { to: "/coordinator/notifications", label: "Notifications", showsNotifications: true },
];

export function Sidebar() {
  const [updates, setUpdates] = useState({ notifications: false, messages: false });
  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const [notifications, messages] = await Promise.all([notificationApi.list(), messageApi.unreadSummary()]);
        setUpdates({
          notifications: notifications.data.data.some((notification) => !notification.isRead),
          messages: Object.keys(messages.data.data.privateByUser).length > 0 || Object.keys(messages.data.data.groupByProject).length > 0,
        });
      } catch { /* keep navigation available if data is unavailable */ }
    };
    loadUpdates();
    const interval = window.setInterval(loadUpdates, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
      <div className="flex h-16 items-center border-b border-gray-100 px-5">
        <span className="text-lg font-semibold text-brand-700">SPMS</span>
        <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          Coordinator
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <span>{item.label}</span>
            {(item.showsMessages ? updates.messages : item.showsNotifications ? updates.notifications : false) && <UnreadDot />}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function UnreadDot() {
  return <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" /><span className="sr-only">Unread updates</span></span>;
}
