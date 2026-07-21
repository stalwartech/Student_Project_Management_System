import { api } from "./client";
import type { ApiEnvelope, AcademicSession } from "@/types";

export const academicSessionApi = {
  list: () => api.get<ApiEnvelope<AcademicSession[]>>("/coordinator/academic-session"),

  create: (payload: { session: string; startDate: string; endDate: string }) =>
    api.post<ApiEnvelope<AcademicSession>>("/coordinator/academic-session", payload),

  update: (id: string, payload: Partial<Pick<AcademicSession, "session" | "startDate" | "endDate">>) =>
    api.patch<ApiEnvelope<AcademicSession>>(`/coordinator/academic-session/${id}`, payload),

  activate: (id: string) => api.patch<ApiEnvelope<AcademicSession>>(`/coordinator/academic-session/${id}/activate`),

  deactivate: (id: string) =>
    api.patch<ApiEnvelope<AcademicSession>>(`/coordinator/academic-session/${id}/deactivate`),
};
