import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { messageApi, notificationApi } from "@/api/misc";

const NAV_ITEMS = [
  { to: "/student/dashboard", label: "Dashboard" },
  { to: "/student/project", label: "My Project" },
  { to: "/student/supervisor", label: "My Supervisor" },
  { to: "/student/feedback", label: "Feedback" },
  { to: "/student/meetings", label: "Meetings" },
  { to: "/student/progress", label: "Progress" },
  { to: "/student/messages", label: "Messages", showsMessages: true },
  { to: "/student/notifications", label: "Notifications", showsUpdates: true },
];

export function Sidebar() {
  const [updates, setUpdates] = useState({ notifications: false, messages: false, feedback: false });

  useEffect(() => {
    const loadUnreadUpdates = async () => {
      try {
        const [response, messageSummary] = await Promise.all([notificationApi.list(), messageApi.unreadSummary()]);
        const unread = response.data.data.filter((notification) => !notification.isRead);
        setUpdates({
          notifications: unread.length > 0,
          messages: Object.keys(messageSummary.data.data.privateByUser).length > 0 || Object.keys(messageSummary.data.data.groupByProject).length > 0,
          feedback: unread.some((notification) => /feedback|submission|chapter/i.test(notification.title)),
        });
      } catch {
        // Navigation remains usable if notifications are temporarily unavailable.
      }
    };
    loadUnreadUpdates();
    const interval = window.setInterval(loadUnreadUpdates, 30_000);
    return () => window.clearInterval(interval);
  }, []);

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
              `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <span>{item.label}</span>
            {(item.showsUpdates ? updates.notifications : item.showsMessages ? updates.messages : item.label === "Feedback" ? updates.feedback : false) && (
              <span className="relative flex h-3 w-3" title="Unread updates">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" />
                <span className="sr-only">Unread updates</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
