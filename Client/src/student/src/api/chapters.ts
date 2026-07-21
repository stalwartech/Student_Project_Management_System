import { api } from "./client";
import type { ApiEnvelope, Chapter } from "@/types";

export const chapterApi = {
  list: (projectId: string) => api.get<ApiEnvelope<Chapter[]>>("/chapters", { params: { project: projectId } }),
  get: (id: string) => api.get<ApiEnvelope<Chapter>>(`/chapters/${id}`),
};
