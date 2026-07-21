import { api } from "./client";
import type { ApiEnvelope, Task } from "@/types";

/**
 * KNOWN BACKEND GAP: taskRoute.js currently applies
 * `router.use(protect, authorize("student"))` to the ENTIRE file, so this
 * GET call will 403 for a supervisor token as the backend stands today.
 * The route needs a supervisor-readable GET /tasks (and /tasks/:id) before
 * this screen will actually load data - see README "Known backend gaps".
 * The frontend call is still correct and ready to work once that's fixed.
 */
export const taskApi = {
  listByChapter: (chapterId: string) => api.get<ApiEnvelope<Task[]>>("/tasks", { params: { chapter: chapterId } }),
};
