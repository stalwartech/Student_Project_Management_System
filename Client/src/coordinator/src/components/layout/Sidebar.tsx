import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { notificationApi, messageApi } from "@/api/misc";
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  UserCheck,
  Upload,
  FolderOpen,
  Wand2,
  History,
  BarChart3,
  Settings,
  MessageSquare,
  Bell,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: {
  to: string;
  label: string;
  icon: LucideIcon;
  showsMessages?: boolean;
  showsNotifications?: boolean;
}[] = [
  { to: "/coordinator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/coordinator/academic-sessions", label: "Academic Sessions", icon: CalendarDays },
  { to: "/coordinator/students", label: "Students", icon: GraduationCap },
  { to: "/coordinator/supervisors", label: "Supervisors", icon: UserCheck },
  { to: "/coordinator/import", label: "Bulk Import", icon: Upload },
  { to: "/coordinator/projects", label: "Projects", icon: FolderOpen },
  { to: "/coordinator/allocation", label: "Auto Allocation", icon: Wand2 },
  { to: "/coordinator/activity", label: "Activity Log", icon: History },
  { to: "/coordinator/reports", label: "Reports", icon: BarChart3 },
  { to: "/coordinator/settings", label: "Settings", icon: Settings },
  { to: "/coordinator/messages", label: "Messages", icon: MessageSquare, showsMessages: true },
  { to: "/coordinator/notifications", label: "Notifications", icon: Bell, showsNotifications: true },
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
    <aside className="hidden w-64 shrink-0 flex-col border-r border-blue-950 bg-blue-950 md:flex">
      <div className="flex h-16 items-center border-b border-blue-950 px-5">
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
          Coordinator
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
              {(item.showsMessages ? updates.messages : item.showsNotifications ? updates.notifications : false) && <UnreadDot />}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

function UnreadDot() {
  return <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" /><span className="sr-only">Unread updates</span></span>;
}