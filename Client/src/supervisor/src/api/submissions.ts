import { api, API_BASE_URL } from "./client";
import type { ApiEnvelope, ChapterSubmission, Feedback } from "@/types";

export const submissionApi = {
  listByChapter: (chapterId: string) => api.get<ApiEnvelope<ChapterSubmission[]>>("/chapter-submissions", { params: { chapter: chapterId } }),

  get: (id: string) => api.get<ApiEnvelope<ChapterSubmission>>(`/chapter-submissions/${id}`),

  history: (id: string) => api.get<ApiEnvelope<ChapterSubmission[]>>(`/chapter-submissions/${id}/history`),

  downloadUrl: (id: string) => `${API_BASE_URL}/chapter-submissions/${id}/download`,

  approve: (id: string, comment?: string) =>
    api.patch<ApiEnvelope<{ submission: ChapterSubmission; feedback: Feedback }>>(`/chapter-submissions/${id}/approve`, { comment }),

  reject: (id: string, comment?: string) =>
    api.patch<ApiEnvelope<{ submission: ChapterSubmission; feedback: Feedback }>>(`/chapter-submissions/${id}/reject`, { comment }),

  requestRevision: (id: string, comment: string) =>
    api.patch<ApiEnvelope<{ submission: ChapterSubmission; feedback: Feedback }>>(
      `/chapter-submissions/${id}/request-revision`,
      { comment }
    ),
};
