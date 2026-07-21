import { api } from "./client";
import type { ApiEnvelope, Notification, Message, ChatType } from "@/types";

// Note: dashboardApi, activityApi ("/activities/system"), settingsApi, and
// reportApi from the coordinator build are intentionally NOT included here -
// those endpoints are coordinator-only (403 for a supervisor token). The
// supervisor dashboard is instead composed client-side from project/meeting/
// feedback/activity-by-supervisor calls - see api/supervisorDashboard.ts.

export const notificationApi = {
  list: () => api.get<ApiEnvelope<Notification[]>>("/notifications"),
  markRead: (id: string) => api.patch<ApiEnvelope<Notification>>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<ApiEnvelope<null>>("/notifications/read-all"),
  remove: (id: string) => api.delete<ApiEnvelope<null>>(`/notifications/${id}`),
  removeAll: () => api.delete<ApiEnvelope<null>>("/notifications"),
};

export const messageApi = {
  send: (payload: { chatType: ChatType; project?: string; recipient?: string; content?: string; attachment?: string }) =>
    api.post<ApiEnvelope<Message>>("/messages", payload),
  privateThread: (userId: string) => api.get<ApiEnvelope<Message[]>>(`/messages/private/${userId}`),
  projectThread: (projectId: string) => api.get<ApiEnvelope<Message[]>>(`/messages/project/${projectId}`),
  markRead: (id: string) => api.patch<ApiEnvelope<Message>>(`/messages/${id}/read`),
};
