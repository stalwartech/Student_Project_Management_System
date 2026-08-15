import { api } from "./client";
import type { ApiEnvelope, Meeting } from "@/types";

export const meetingApi = {
  list: (project?: string) => api.get<ApiEnvelope<Meeting[]>>("/meetings", { params: project ? { project } : undefined }),

  get: (id: string) => api.get<ApiEnvelope<Meeting>>(`/meetings/${id}`),

  create: (payload: { project: string; title: string; description?: string; meetingURL: string; startedAt: string; endedAt: string }) =>
    api.post<ApiEnvelope<Meeting>>("/meetings", payload),

  update: (id: string, payload: Partial<Pick<Meeting, "title" | "description" | "meetingURL" | "startedAt" | "endedAt">>) =>
    api.patch<ApiEnvelope<Meeting>>(`/meetings/${id}`, payload),

  cancel: (id: string) => api.patch<ApiEnvelope<Meeting>>(`/meetings/${id}/cancel`),
  attendance: (id: string) => api.get<ApiEnvelope<Meeting["attendees"]>>(`/meetings/${id}/attendance`),

  markAttendance: (id: string, userId: string, status: "invited" | "joined" | "declined") =>
    api.post<ApiEnvelope<Meeting["attendees"]>>(`/meetings/${id}/attendance`, { userId, status }),
};
