export type Role = "coordinator" | "supervisor" | "student";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  gender?: string;
  phone?: string;
  whatsapp?: string;
  photo?: string;
  department: string;
  matric?: string;
  level?: string;
  staffId?: string;
  title?: string;
  isActivated: boolean;
  isDeactivated: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AcademicSession {
  _id: string;
  session: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string;
}

export type ProjectStatus = "Not Started" | "In Progress" | "Completed" | "Archived";
export type ProjectType = "Individual" | "Group";

export interface Project {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  startDate: string;
  supervisor?: Pick<User, "_id" | "name" | "email" | "title">;
  students: Pick<User, "_id" | "name" | "matric" | "email">[];
  projectLeader?: string;
  projectType: ProjectType;
  projectCode: string;
  status: ProjectStatus;
  completionPercentage: number;
  department?: string;
  academicSession: string | AcademicSession;
  isLocked: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  total: number;
  page: number;
  limit: number;
  [key: string]: unknown; // the array key name varies per endpoint (students/supervisors/projects)
  items?: T[];
}

export interface ImportRowIssue {
  row: number;
  reason?: string;
  missingFields?: string[];
  email?: string;
  matric?: string;
  staffId?: string;
}

export interface ImportSummary {
  imported: { id: string; name: string; email: string }[];
  duplicates: ImportRowIssue[];
  invalid: ImportRowIssue[];
  missing: ImportRowIssue[];
}

export interface DashboardStats {
  totalStudents: number;
  totalSupervisors: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  studentsWithoutProjects: number;
  studentsPendingActivation: number;
  pendingChapterReviews: number;
  upcomingMeetings: number;
  activeAcademicSession: string | null;
}

export interface DashboardCharts {
  projectCompletionRate: { _id: string; count: number }[];
  chapterSubmissionTrends: { _id: string; count: number }[];
}

export interface SupervisorWorkload {
  currentLoad: number;
  limit: number;
  exceeded: boolean;
  projects: Pick<Project, "_id" | "title" | "status" | "academicSession">[];
}

export interface ActivityLogEntry {
  _id: string;
  actor: Pick<User, "_id" | "name" | "role"> | string;
  action: string;
  entityType?: string;
  entityId?: string;
  project?: string;
  description?: string;
  createdAt: string;
}

export interface Settings {
  _id: string;
  defaultProjectLimit: number;
  defaultSupervisorLimit: number;
  defaultStudentLimit: number;
  autoAllocationEnabled: boolean;
}

export interface AllocationProposal {
  student: string;
  project?: string;
  supervisor?: string;
  mode?: "project" | "supervisor";
}
export interface AllocationSkipped {
  student: string;
  reason: string;
}
export interface AllocationResult {
  assigned?: number;
  proposals: AllocationProposal[];
  skipped: AllocationSkipped[];
}

export interface AssignStudentResult {
  assigned: string[];
  conflicts: {
    studentId: string;
    existingProjectId: string;
    existingProjectTitle: string;
    message: string;
  }[];
  skipped: { studentId: string; reason: string }[];
}

export interface Notification {
  _id: string;
  sender?: string;
  recipient: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export type ChatType = "Private" | "Project Group";

export interface Message {
  _id: string;
  sender: Pick<User, "_id" | "name" | "role"> | string;
  content?: string;
  chatType: ChatType;
  project?: string;
  recipient?: string;
  attachment?: string;
  status: "sent" | "delivered" | "read";
  readBy?: string[];
  createdAt: string;
}

export const REPORT_TYPES = [
  "students",
  "supervisors",
  "projects",
  "academic-sessions",
  "project-completion",
  "meetings",
  "feedback",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
