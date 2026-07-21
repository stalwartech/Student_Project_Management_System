import { api } from "./client";
import type { ApiEnvelope, ChapterSubmission } from "@/types";

export const submissionApi = {
  create: (chapterId: string, file: File) => {
    const form = new FormData();
    form.append("chapter", chapterId);
    form.append("file", file);
    return api.post<ApiEnvelope<ChapterSubmission>>("/chapter-submissions", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  addVersion: (submissionId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ApiEnvelope<ChapterSubmission>>(`/chapter-submissions/${submissionId}/version`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  get: (id: string) => api.get<ApiEnvelope<ChapterSubmission>>(`/chapter-submissions/${id}`),

  history: (id: string) => api.get<ApiEnvelope<ChapterSubmission[]>>(`/chapter-submissions/${id}/history`),

  downloadUrl: (id: string) => `/api/chapter-submissions/${id}/download`,
};
