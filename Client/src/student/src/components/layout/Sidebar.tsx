import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { messageApi, notificationApi } from "@/api/misc";
import {
  LayoutDashboard,
  FolderOpen,
  UserCheck,
  MessageSquareText,
  CalendarDays,
  TrendingUp,
  MessageSquare,
  Bell,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: {
  to: string;
  label: string;
  icon: LucideIcon;
  showsMessages?: boolean;
  showsUpdates?: boolean;
}[] = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/project", label: "My Project", icon: FolderOpen },
  { to: "/student/supervisor", label: "My Supervisor", icon: UserCheck },
  { to: "/student/feedback", label: "Feedback", icon: MessageSquareText },
  { to: "/student/meetings", label: "Meetings", icon: CalendarDays },
  { to: "/student/progress", label: "Progress", icon: TrendingUp },
  { to: "/student/messages", label: "Messages", icon: MessageSquare, showsMessages: true },
  { to: "/student/notifications", label: "Notifications", icon: Bell, showsUpdates: true },
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
    <aside className="hidden w-64 shrink-0 flex-col border-r border-blue-950 bg-blue-950 md:flex">
      <div className="flex h-20 items-center border-b border-blue-950 px-5">
        <div className="flex items-center gap-2.5">
          <svg
            className="h-9 w-9 shrink-0 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 10 12 5 2 10l10 5 10-5Z" />
            <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
            <path d="M22 10v6" />
          </svg>
          <div>
            <div className="text-lg font-bold leading-tight text-white">SPMS</div>
          </div>
        </div>
        <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          Student
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-400 text-brand-50" : "text-white hover:bg-brand-400"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">{item.label}</span>
              {(item.showsUpdates ? updates.notifications : item.showsMessages ? updates.messages : item.label === "Feedback" ? updates.feedback : false) && (
                <span className="relative flex h-3 w-3" title="Unread updates">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" />
                  <span className="sr-only">Unread updates</span>
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}