import { useEffect, useState } from "react";
import { notificationApi } from "@/api/misc";
import type { Notification } from "@/types";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelative } from "@/utils/format";

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await notificationApi.list();
    setNotifications(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await notificationApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const remove = async (id: string) => {
    await notificationApi.remove(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread`}
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" onClick={markAllRead}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : notifications.length === 0 ? (
        <EmptyState title="You're all caught up" description="New notifications will show up here." />
      ) : (
        <div className="card divide-y divide-gray-100">
          {notifications.map((n) => (
            <div key={n._id} className={`flex items-start justify-between px-4 py-4 ${!n.isRead ? "bg-brand-50/40" : ""}`}>
              <div>
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="mt-0.5 text-sm text-gray-500">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{formatRelative(n.createdAt)}</p>
              </div>
              <div className="flex shrink-0 gap-3 pl-4">
                {!n.isRead && (
                  <button onClick={() => markRead(n._id)} className="text-xs font-medium text-brand-600 hover:underline">
                    Mark read
                  </button>
                )}
                <button onClick={() => remove(n._id)} className="text-xs font-medium text-gray-400 hover:text-red-600">
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
