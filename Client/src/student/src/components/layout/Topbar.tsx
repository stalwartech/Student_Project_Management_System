import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { notificationApi } from "@/api/misc";
import type { Notification } from "@/types";
import { formatRelative } from "@/utils/format";

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.list();
      setNotifications(res.data.data);
    } catch {
      // Silently ignore - notification bell shouldn't break the page.
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60_000); // light polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/student/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-4" ref={panelRef}>
        <div className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-brand-600 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">You're all caught up.</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n._id} className={`border-b border-gray-50 px-4 py-3 ${!n.isRead ? "bg-brand-50/40" : ""}`}>
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500">{n.message}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{formatRelative(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
              <Link
                to="/student/notifications"
                className="block border-t border-gray-100 px-4 py-2 text-center text-xs font-medium text-brand-600 hover:bg-gray-50"
                onClick={() => setShowNotifications(false)}
              >
                View all
              </Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-2 py-1 hover:bg-gray-50"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {user?.name?.[0]?.toUpperCase() ?? "C"}
            </span>
            <span className="hidden text-sm text-gray-700 sm:block">{user?.name}</span>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              <Link to="/student/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>
                Account settings
              </Link>
              <button onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
