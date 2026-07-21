import { api } from "./client";
import type {
  ApiEnvelope,
  DashboardStats,
  DashboardCharts,
  ActivityLogEntry,
  Settings,
  Notification,
  Message,
  ChatType,
  ReportType,
} from "@/types";

export const dashboardApi = {
  stats: () => api.get<ApiEnvelope<DashboardStats>>("/coordinator/dashboard"),
  charts: () => api.get<ApiEnvelope<DashboardCharts>>("/coordinator/analytics"),
};

export const activityApi = {
  system: (page = 1, limit = 20) =>
    api.get<ApiEnvelope<{ activities: ActivityLogEntry[]; page: number; limit: number }>>("/activities/system", {
      params: { page, limit },
    }),
};

export const settingsApi = {
  get: () => api.get<ApiEnvelope<Settings>>("/settings"),
  update: (payload: Partial<Settings>) => api.patch<ApiEnvelope<Settings>>("/settings", payload),
  toggleAutoAllocation: (autoAllocationEnabled: boolean) =>
    api.patch<ApiEnvelope<Settings>>("/settings/auto-allocation", { autoAllocationEnabled }),
};

export const reportApi = {
  downloadUrl: (type: ReportType, format: "csv" | "excel" | "pdf") => `/api/reports/${type}?format=${format}`,
};

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
