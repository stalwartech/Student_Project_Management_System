import { api } from "./client";
import type { ApiEnvelope, Project, ActivityLogEntry, ProjectType, User } from "@/types";

export interface CreateProjectPayload {
  title: string;
  description: string;
  deadline: string;
  startDate: string;
  department?: string;
  studentIds: string[];
  projectLeader?: string;
}

export const projectApi = {
  assigned: () => api.get<ApiEnvelope<Project[]>>("/projects/assigned"),

  availableStudents: () =>
    api.get<ApiEnvelope<{ session: string; students: Pick<User, "_id" | "name" | "matric" | "email" | "department" | "level">[] }>>("/supervisor/available-students"),

  create: (payload: CreateProjectPayload) => api.post<ApiEnvelope<Project>>("/supervisor/projects", payload),

  updateType: (id: string, projectType: ProjectType) =>
    api.patch<ApiEnvelope<Project>>(`/supervisor/projects/${id}/type`, { projectType }),

  get: (id: string) => api.get<ApiEnvelope<Project>>(`/projects/${id}`),

  members: (id: string) =>
    api.get<ApiEnvelope<{ supervisor: Project["supervisor"]; students: Project["students"] }>>(
      `/projects/${id}/members`
    ),

  timeline: (id: string) => api.get<ApiEnvelope<{ _id: string; title: string; status: string; chapterNumber?: string; deadline?: string }[]>>(
    `/projects/${id}/timeline`
  ),

  analytics: (id: string) =>
    api.get<ApiEnvelope<{ totalChapters: number; completedChapters: number; chapterCompletionRate: number }>>(
      `/projects/${id}/analytics`
    ),

  activity: (id: string) => api.get<ApiEnvelope<{ activities: ActivityLogEntry[] }>>(`/activities/project/${id}`),

  lock: (id: string) => api.patch<ApiEnvelope<Project>>(`/projects/${id}/lock`),
  unlock: (id: string) => api.patch<ApiEnvelope<Project>>(`/projects/${id}/unlock`),
};
