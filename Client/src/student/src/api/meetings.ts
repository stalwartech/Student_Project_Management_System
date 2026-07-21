import { api } from "./client";
import type { ApiEnvelope, Meeting } from "@/types";

export const meetingApi = {
  list: () => api.get<ApiEnvelope<Meeting[]>>("/meetings"),
  get: (id: string) => api.get<ApiEnvelope<Meeting>>(`/meetings/${id}`),
  join: (id: string) => api.post<ApiEnvelope<{ meetingURL: string }>>(`/meetings/${id}/join`),
};
