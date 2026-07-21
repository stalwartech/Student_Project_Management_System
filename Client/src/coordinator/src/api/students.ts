import { api } from "./client";
import type { ApiEnvelope, User } from "@/types";

export interface StudentListParams {
  search?: string;
  department?: string;
  level?: string;
  activated?: "true" | "false";
  page?: number;
  limit?: number;
}

export interface StudentListResponse {
  students: User[];
  total: number;
  page: number;
  limit: number;
}

export const studentApi = {
  list: (params: StudentListParams = {}) =>
    api.get<ApiEnvelope<StudentListResponse>>("/coordinator/students", { params }),

  get: (id: string) => api.get<ApiEnvelope<User>>(`/coordinator/students/${id}`),

  activate: (id: string) => api.patch<ApiEnvelope<User>>(`/coordinator/students/${id}/activate`),

  deactivate: (id: string) => api.patch<ApiEnvelope<User>>(`/coordinator/students/${id}/deactivate`),
};
