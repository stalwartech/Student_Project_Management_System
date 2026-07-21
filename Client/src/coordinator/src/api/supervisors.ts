import { api } from "./client";
import type { ApiEnvelope, User, SupervisorWorkload } from "@/types";

export interface SupervisorListParams {
  search?: string;
  department?: string;
  page?: number;
  limit?: number;
}

export interface SupervisorListResponse {
  supervisors: User[];
  total: number;
  page: number;
  limit: number;
}

export const supervisorApi = {
  list: (params: SupervisorListParams = {}) =>
    api.get<ApiEnvelope<SupervisorListResponse>>("/coordinator/supervisors", { params }),

  get: (id: string) => api.get<ApiEnvelope<User>>(`/coordinator/supervisors/${id}`),

  update: (id: string, payload: Partial<User>) =>
    api.patch<ApiEnvelope<User>>(`/coordinator/supervisors/${id}`, payload),

  workload: (id: string, academicSession?: string) =>
    api.get<ApiEnvelope<SupervisorWorkload>>(`/coordinator/supervisors/${id}/workload`, {
      params: academicSession ? { academicSession } : undefined,
    }),

  activate: (id: string) => api.patch<ApiEnvelope<User>>(`/coordinator/supervisors/${id}/activate`),

  deactivate: (id: string) => api.patch<ApiEnvelope<User>>(`/coordinator/supervisors/${id}/deactivate`),

  setLimit: (supervisorId: string, limit: number) =>
    api.patch<ApiEnvelope<unknown>>("/settings/supervisor-limit", { supervisorId, limit }),
};
