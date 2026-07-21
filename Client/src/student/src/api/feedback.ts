import { api } from "./client";
import type { ApiEnvelope, Feedback } from "@/types";

export const feedbackApi = {
  list: (params: { project?: string } = {}) => api.get<ApiEnvelope<Feedback[]>>("/feedback", { params }),

  bySubmission: (submissionId: string) => api.get<ApiEnvelope<Feedback[]>>(`/feedback/submission/${submissionId}`),

  reply: (feedbackId: string, response: string) =>
    api.post<ApiEnvelope<Feedback>>(`/feedback/${feedbackId}/reply`, { response }),
};
