import { api } from "./client";
import type { ApiEnvelope, User } from "@/types";

export interface SupervisorAssignment {
  supervisor: Pick<User, "_id" | "name" | "email" | "title" | "department" | "phone" | "whatsapp" | "staffId"> | null;
  session: { _id: string; session: string; isActive: boolean } | null;
  projectTitle: string | null;
}

export const assignmentApi = {
  mySupervisor: () => api.get<ApiEnvelope<SupervisorAssignment>>("/student/my-supervisor"),
};
