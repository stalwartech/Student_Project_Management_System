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
  createdAt: string;
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
  academicSession: string;
  isLocked: boolean;
  createdAt: string;
}

export type ChapterStatus = "Not Started" | "In Progress" | "Submitted" | "Approved" | "Completed";

export interface Chapter {
  _id: string;
  title: string;
  status: ChapterStatus;
  startDate?: string;
  deadline?: string;
  completionDate?: string;
  priority?: "Low" | "Medium" | "High";
  project: string;
  chapterNumber?: string;
  isLocked: boolean;
  createdAt: string;
}

export type SubmissionStatus = "pending" | "approved" | "rejected" | "revision_requested";

export interface ChapterSubmission {
  _id: string;
  chapter: string;
  PDFFile: string;
  version: number;
  submittedBy: Pick<User, "_id" | "name" | "matric"> | string;
  submittedAt: string;
  status: SubmissionStatus;
  reviewedBy?: Pick<User, "_id" | "name" | "title"> | string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
}

export interface ChecklistItem {
  _id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
}

export type TaskStatus = "Not Started" | "In Progress" | "Completed" | "Overdue";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  startDate?: string;
  deadline?: string;
  completionDate?: string;
  chapter: string;
  taskNumber?: string;
  checklist: ChecklistItem[];
  createdAt: string;
}

export type FeedbackStatus = "open" | "resolved" | "reopened";
export type FeedbackPriority = "Low" | "Medium" | "High";

export interface Feedback {
  _id: string;
  priority: FeedbackPriority;
  createdBy: Pick<User, "_id" | "name" | "role"> | string;
  project: string | Pick<Project, "_id" | "title">;
  chapterSubmission: string;
  status: FeedbackStatus;
  feedbackType?: string;
  comment: string;
  response?: string;
  responseAt?: string;
  read: boolean;
  createdAt: string;
}

export type MeetingStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export interface MeetingAttendee {
  user: Pick<User, "_id" | "name" | "role"> | string;
  status: "invited" | "joined" | "declined";
  joinedAt?: string;
}

export interface Meeting {
  _id: string;
  createdBy: string;
  project: string | Pick<Project, "_id" | "title">;
  attendees: MeetingAttendee[];
  meetingURL: string;
  title: string;
  description?: string;
  startedAt?: string;
  endedAt?: string;
  status: MeetingStatus;
  duration: number;
  createdAt: string;
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

export interface Attachment {
  _id: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  uploadedBy: string;
  task?: string;
  chapterSubmission?: string;
  message?: string;
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
