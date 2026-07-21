import { api } from "./client";
import type { ApiEnvelope, Task, ChecklistItem, Attachment } from "@/types";

export const taskApi = {
  listByChapter: (chapterId: string) => api.get<ApiEnvelope<Task[]>>("/tasks", { params: { chapter: chapterId } }),

  get: (id: string) => api.get<ApiEnvelope<Task>>(`/tasks/${id}`),

  create: (payload: { title: string; chapter: string; description?: string; deadline?: string; taskNumber?: string }) =>
    api.post<ApiEnvelope<Task>>("/tasks", payload),

  update: (id: string, payload: Partial<Pick<Task, "title" | "description" | "deadline" | "taskNumber">>) =>
    api.patch<ApiEnvelope<Task>>(`/tasks/${id}`, payload),

  remove: (id: string) => api.delete<ApiEnvelope<null>>(`/tasks/${id}`),

  complete: (id: string) => api.patch<ApiEnvelope<Task>>(`/tasks/${id}/complete`),

  setStatus: (id: string, status: string) => api.patch<ApiEnvelope<Task>>(`/tasks/${id}/status`, { status }),

  addChecklistItem: (taskId: string, title: string) =>
    api.post<ApiEnvelope<ChecklistItem>>(`/tasks/${taskId}/checklists`, { title }),

  updateChecklistItem: (checklistId: string, title: string) =>
    api.patch<ApiEnvelope<ChecklistItem>>(`/checklists/${checklistId}`, { title }),

  deleteChecklistItem: (checklistId: string) => api.delete<ApiEnvelope<null>>(`/checklists/${checklistId}`),

  completeChecklistItem: (checklistId: string) =>
    api.patch<ApiEnvelope<ChecklistItem>>(`/checklist/${checklistId}/complete`),

  addEvidence: (taskId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ApiEnvelope<Attachment>>(`/tasks/${taskId}/evidence`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteEvidence: (taskId: string, fileId: string) => api.delete<ApiEnvelope<null>>(`/tasks/${taskId}/evidence/${fileId}`),
};
