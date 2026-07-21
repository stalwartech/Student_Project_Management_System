import { api } from "./client";
import type { ApiEnvelope, Project } from "@/types";

export const projectApi = {
  myProject: () => api.get<ApiEnvelope<Project>>("/projects/my-project"),

  timeline: (id: string) =>
    api.get<ApiEnvelope<{ _id: string; title: string; status: string; chapterNumber?: string; deadline?: string }[]>>(
      `/projects/${id}/timeline`
    ),

  analytics: (id: string) =>
    api.get<ApiEnvelope<{ totalChapters: number; completedChapters: number; chapterCompletionRate: number }>>(
      `/projects/${id}/analytics`
    ),
};
