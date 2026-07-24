import { api } from "./client";
import type { ApiEnvelope, Task } from "@/types";

export const taskApi = {
  listByChapter: (chapterId: string) => api.get<ApiEnvelope<Task[]>>("/tasks", { params: { chapter: chapterId } }),
  lock: (id: string) => api.patch<ApiEnvelope<Task>>(`/tasks/${id}/lock`),
  unlock: (id: string) => api.patch<ApiEnvelope<Task>>(`/tasks/${id}/unlock`),
  addFeedback: (id: string, comment: string) => api.post(`/tasks/${id}/feedback`, { comment }),
};
