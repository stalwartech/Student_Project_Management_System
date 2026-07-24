import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { chapterApi } from "@/api/chapters";
import { taskApi } from "@/api/tasks";
import type { Chapter, Task } from "@/types";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/api/client";
import { useToast } from "@/context/ToastContext";

export function TaskMonitoringPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [tasksByChapter, setTasksByChapter] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const { show } = useToast();

  const refreshTasks = async () => {
    if (!projectId) return;
    const chaptersRes = await chapterApi.list(projectId);
    const results = await Promise.all(chaptersRes.data.data.map((chapter) => taskApi.listByChapter(chapter._id).then((res) => [chapter._id, res.data.data] as const)));
    setTasksByChapter(Object.fromEntries(results));
  };

  const toggleTaskLock = async (task: Task) => {
    try {
      if (task.isLocked) await taskApi.unlock(task._id);
      else await taskApi.lock(task._id);
      show(`Task ${task.isLocked ? "unlocked" : "locked"}`, "success");
      refreshTasks();
    } catch (err) { show(getErrorMessage(err), "error"); }
  };

  const giveFeedback = async (task: Task) => {
    const comment = window.prompt(`Feedback for “${task.title}”`);
    if (!comment?.trim()) return;
    try {
      await taskApi.addFeedback(task._id, comment);
      show("Task feedback sent", "success");
      refreshTasks();
    } catch (err) { show(getErrorMessage(err), "error"); }
  };

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setLoading(true);
      const chaptersRes = await chapterApi.list(projectId);
      setChapters(chaptersRes.data.data);

      try {
        const results = await Promise.all(
          chaptersRes.data.data.map((c) => taskApi.listByChapter(c._id).then((r) => [c._id, r.data.data] as const))
        );
        setTasksByChapter(Object.fromEntries(results));
      } catch (err: any) {
        if (err?.response?.status === 403) setPermissionError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <Link to={`/supervisor/projects/${projectId}`} className="text-sm text-brand-600 hover:underline">
        ← Back to project
      </Link>
      <PageHeader title="Task Monitoring" description="Read-only view of student tasks and checklists" />

      {!permissionError && chapters.length === 0 && (
        <EmptyState title="No chapters yet" description="Tasks will appear here once chapters and tasks exist." />
      )}

      {!permissionError &&
        chapters.map((chapter) => {
          const tasks = tasksByChapter[chapter._id] ?? [];
          return (
            <div key={chapter._id} className="card mb-4 p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{chapter.title}</h3>
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-400">No tasks created for this chapter yet.</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => {
                    const completed = task.checklist.filter((c) => c.isCompleted).length;
                    const total = task.checklist.length;
                    const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "Completed";
                    return (
                      <div key={task._id} className="rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <div className="flex items-center gap-2">
                            {overdue && <Badge color="red">Overdue</Badge>}
                            <Badge color={statusColor(task.status)}>{task.status}</Badge>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button variant="secondary" className="text-xs" onClick={() => toggleTaskLock(task)}>{task.isLocked ? "Unlock task" : "Lock task"}</Button>
                          <Button variant="secondary" className="text-xs" onClick={() => giveFeedback(task)}>Give feedback</Button>
                        </div>
                        {task.feedback?.length > 0 && <p className="mt-2 text-xs text-gray-500">Latest feedback: {task.feedback[task.feedback.length - 1].comment}</p>}
                        {task.deadline && <p className="mt-1 text-xs text-gray-400">Due {formatDate(task.deadline)}</p>}
                        {total > 0 && (
                          <div className="mt-2">
                            <div className="h-1.5 w-full rounded-full bg-gray-100">
                              <div
                                className="h-1.5 rounded-full bg-brand-600"
                                style={{ width: `${Math.round((completed / total) * 100)}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                              {completed}/{total} checklist items complete
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
