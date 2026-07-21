import { api } from "./client";
import type { ApiEnvelope, Project, ProjectType, AssignStudentResult, ActivityLogEntry } from "@/types";

export interface ProjectListParams {
  search?: string;
  status?: string;
  department?: string;
  academicSession?: string;
  supervisor?: string;
  projectType?: ProjectType;
  page?: number;
  limit?: number;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  projectType: ProjectType;
  academicSession: string;
  deadline: string;
  startDate: string;
  department?: string;
  supervisor?: string;
}

export const projectApi = {
  list: (params: ProjectListParams = {}) =>
    api.get<ApiEnvelope<ProjectListResponse>>("/coordinator/projects", { params }),

  get: (id: string) => api.get<ApiEnvelope<Project>>(`/projects/${id}`),

  members: (id: string) =>
    api.get<ApiEnvelope<{ supervisor: Project["supervisor"]; students: Project["students"] }>>(
      `/projects/${id}/members`
    ),

  timeline: (id: string) => api.get<ApiEnvelope<unknown[]>>(`/projects/${id}/timeline`),

  analytics: (id: string) =>
    api.get<ApiEnvelope<{ totalChapters: number; completedChapters: number; chapterCompletionRate: number }>>(
      `/projects/${id}/analytics`
    ),

  activity: (id: string) => api.get<ApiEnvelope<{ activities: ActivityLogEntry[] }>>(`/activities/project/${id}`),

  create: (payload: CreateProjectPayload) => api.post<ApiEnvelope<Project>>("/coordinator/projects", payload),

  update: (id: string, payload: Partial<CreateProjectPayload>) =>
    api.patch<ApiEnvelope<Project>>(`/coordinator/projects/${id}`, payload),

  remove: (id: string) => api.delete<ApiEnvelope<null>>(`/coordinator/projects/${id}`),

  assignSupervisor: (projectId: string, supervisorId: string) =>
    api.post<ApiEnvelope<{ project: Project; workloadWarning: string | null }>>(
      `/coordinator/projects/${projectId}/assign-supervisor`,
      { supervisorId }
    ),

  changeSupervisor: (projectId: string, supervisorId: string) =>
    api.patch<ApiEnvelope<{ project: Project; workloadWarning: string | null }>>(
      `/coordinator/projects/${projectId}/change-supervisor`,
      { supervisorId }
    ),

  assignStudents: (projectId: string, studentIds: string[], force?: "keep" | "reassign" | "skip") =>
    api.post<ApiEnvelope<AssignStudentResult>>(`/coordinator/projects/${projectId}/assign-student`, {
      studentIds,
      force,
    }),

  removeStudent: (projectId: string, studentId: string) =>
    api.delete<ApiEnvelope<Project>>(`/coordinator/projects/${projectId}/remove-student/${studentId}`),
};
