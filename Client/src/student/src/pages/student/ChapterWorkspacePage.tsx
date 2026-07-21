import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { chapterApi } from "@/api/chapters";
import { taskApi } from "@/api/tasks";
import { getErrorMessage } from "@/api/client";
import type { Chapter, Task } from "@/types";
import { useForm } from "@/hooks/useForm";
import { useToast } from "@/context/ToastContext";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField, TextAreaField } from "@/components/ui/FormField";
import { formatDate } from "@/utils/format";

export function ChapterWorkspacePage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { show } = useToast();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm({ title: "", description: "", deadline: "", taskNumber: "" });

  const load = async () => {
    if (!chapterId) return;
    setLoading(true);
    const [chapterRes, tasksRes] = await Promise.all([chapterApi.get(chapterId), taskApi.listByChapter(chapterId)]);
    setChapter(chapterRes.data.data);
    setTasks(tasksRes.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const handleCreate = async () => {
    if (!chapterId) return;
    setSaving(true);
    try {
      await taskApi.create({ ...form.values, chapter: chapterId });
      show("Task created", "success");
      setShowCreate(false);
      form.reset();
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !chapter) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const canAddTasks = !chapter.isLocked;

  return (
    <div>
      <Link to="/student/project" className="text-sm text-brand-600 hover:underline">
        ← Back to My Project
      </Link>
      <PageHeader
        title={chapter.title}
        description={chapter.deadline ? `Due ${formatDate(chapter.deadline)}` : undefined}
        actions={
          <>
            <Badge color={statusColor(chapter.status)}>{chapter.status}</Badge>
            {chapter.isLocked && <Badge color="gray">Locked</Badge>}
            <Link to={`/student/chapters/${chapter._id}/submit`}>
              <Button>Submit chapter</Button>
            </Link>
          </>
        }
      />

      {chapter.isLocked && (
        <div className="card mb-4 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            This chapter is locked by your supervisor — you can view tasks but can't add new ones until it's unlocked.
          </p>
        </div>
      )}

      <div className="mb-3 flex justify-end">
        <Button onClick={() => setShowCreate(true)} disabled={!canAddTasks}>
          New task
        </Button>
      </div>

      <div className="card divide-y divide-gray-100">
        {tasks.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">No tasks yet for this chapter.</p>
        ) : (
          tasks.map((task) => {
            const completed = task.checklist.filter((c) => c.isCompleted).length;
            const total = task.checklist.length;
            return (
              <Link key={task._id} to={`/student/tasks/${task._id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {total > 0 && (
                    <p className="text-xs text-gray-400">
                      {completed}/{total} checklist items
                    </p>
                  )}
                </div>
                <Badge color={statusColor(task.status)}>{task.status}</Badge>
              </Link>
            );
          })
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Title" value={form.values.title} onChange={form.update("title")} required />
          <TextAreaField label="Description" rows={3} value={form.values.description} onChange={form.update("description")} />
          <TextField label="Deadline" type="date" value={form.values.deadline} onChange={form.update("deadline")} />
          <TextField label="Task number" value={form.values.taskNumber} onChange={form.update("taskNumber")} />
        </div>
      </Modal>
    </div>
  );
}
