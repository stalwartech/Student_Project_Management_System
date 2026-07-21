import { api } from "./client";
import type { ApiEnvelope, Project, ActivityLogEntry } from "@/types";

export const projectApi = {
  assigned: () => api.get<ApiEnvelope<Project[]>>("/projects/assigned"),

  get: (id: string) => api.get<ApiEnvelope<Project>>(`/projects/${id}`),

  members: (id: string) =>
    api.get<ApiEnvelope<{ supervisor: Project["supervisor"]; students: Project["students"] }>>(
      `/projects/${id}/members`
    ),

  timeline: (id: string) => api.get<ApiEnvelope<{ _id: string; title: string; status: string; chapterNumber?: string; deadline?: string }[]>>(
    `/projects/${id}/timeline`
  ),

  analytics: (id: string) =>
    api.get<ApiEnvelope<{ totalChapters: number; completedChapters: number; chapterCompletionRate: number }>>(
      `/projects/${id}/analytics`
    ),

  activity: (id: string) => api.get<ApiEnvelope<{ activities: ActivityLogEntry[] }>>(`/activities/project/${id}`),

  lock: (id: string) => api.patch<ApiEnvelope<Project>>(`/projects/${id}/lock`),
  unlock: (id: string) => api.patch<ApiEnvelope<Project>>(`/projects/${id}/unlock`),
};
