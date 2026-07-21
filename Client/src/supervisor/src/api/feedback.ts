import { api } from "./client";
import type { ApiEnvelope, Feedback } from "@/types";

export const feedbackApi = {
  list: (params: { project?: string; status?: string } = {}) => api.get<ApiEnvelope<Feedback[]>>("/feedback", { params }),

  bySubmission: (submissionId: string) => api.get<ApiEnvelope<Feedback[]>>(`/feedback/submission/${submissionId}`),

  create: (payload: { project: string; chapterSubmission: string; comment: string; priority?: string; feedbackType?: string }) =>
    api.post<ApiEnvelope<Feedback>>("/feedback", payload),

  resolve: (id: string) => api.patch<ApiEnvelope<Feedback>>(`/feedback/${id}/resolve`),
  reopen: (id: string) => api.patch<ApiEnvelope<Feedback>>(`/feedback/${id}/reopen`),
};
