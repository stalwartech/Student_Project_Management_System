import { api } from "./client";
import type { ApiEnvelope, Chapter } from "@/types";

export const chapterApi = {
  list: (projectId: string) => api.get<ApiEnvelope<Chapter[]>>("/chapters", { params: { project: projectId } }),

  get: (id: string) => api.get<ApiEnvelope<Chapter>>(`/chapters/${id}`),

  create: (payload: { title: string; project: string; chapterNumber?: string; deadline?: string; priority?: string }) =>
    api.post<ApiEnvelope<Chapter>>("/chapters", payload),

  update: (id: string, payload: Partial<Pick<Chapter, "title" | "deadline" | "priority" | "chapterNumber">>) =>
    api.patch<ApiEnvelope<Chapter>>(`/chapters/${id}`, payload),

  remove: (id: string) => api.delete<ApiEnvelope<null>>(`/chapters/${id}`),

  lock: (id: string) => api.patch<ApiEnvelope<Chapter>>(`/chapters/${id}/lock`),
  unlock: (id: string) => api.patch<ApiEnvelope<Chapter>>(`/chapters/${id}/unlock`),
  complete: (id: string) => api.patch<ApiEnvelope<Chapter>>(`/chapters/${id}/complete`),
};
