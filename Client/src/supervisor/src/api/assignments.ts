import { api } from "./client";
import type { ApiEnvelope, User } from "@/types";

export interface AssignedStudent extends Pick<User, "_id" | "name" | "email" | "matric" | "department" | "level" | "gender" | "phone" | "whatsapp"> {
  sessions: { _id: string; session: string; isActive: boolean; projectTitle?: string | null }[];
}

export const assignmentApi = {
  assignedStudents: () => api.get<ApiEnvelope<AssignedStudent[]>>("/supervisor/assigned-students"),
};
