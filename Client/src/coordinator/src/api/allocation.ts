import { api } from "./client";
import type { ApiEnvelope, AllocationResult, User } from "@/types";

export interface ManualAllocationOptions {
  session: { _id: string; session: string };
  students: (Pick<User, "_id" | "name" | "matric" | "email" | "department"> & {
    assignedSupervisor?: Pick<User, "_id" | "name" | "title"> | null;
  })[];
  supervisors: Pick<User, "_id" | "name" | "title" | "staffId" | "email" | "department">[];
}

export const allocationApi = {
  readiness: () =>
    api.get<ApiEnvelope<{ canRun: boolean; activeSession: string | null; unassignedStudents: number; supervisedProjects: number; supervisors: number; message: string | null }>>(
      "/coordinator/projects/allocation-readiness"
    ),
  preview: () => api.post<ApiEnvelope<AllocationResult>>("/coordinator/projects/preview-allocation"),
  run: () => api.post<ApiEnvelope<AllocationResult>>("/coordinator/projects/auto-allocation"),
  manualOptions: () => api.get<ApiEnvelope<ManualAllocationOptions>>("/coordinator/projects/manual-allocation-options"),
  assignStudentToSupervisor: (studentId: string, supervisorId: string) =>
    api.post<ApiEnvelope<unknown>>("/coordinator/projects/assign-student-supervisor", { studentId, supervisorId }),
  saveSupervisorAllocations: (assignments: { studentId: string; supervisorId: string }[]) =>
    api.post<ApiEnvelope<{ saved: number }>>("/coordinator/projects/save-supervisor-allocations", { assignments }),
};
