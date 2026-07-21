import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { taskApi } from "@/api/tasks";
import { getErrorMessage } from "@/api/client";
import type { Task, Attachment } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/FormField";
import { formatDate } from "@/utils/format";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed", "Overdue"];

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { show } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  // Uploaded-this-session evidence, since there's no GET endpoint to list a
  // task's existing evidence on reload (see README - backend gap).
  const [uploadedEvidence, setUploadedEvidence] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!taskId) return;
    setLoading(true);
    const res = await taskApi.get(taskId);
    setTask(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const toggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    if (isCompleted) return; // no "uncomplete" endpoint on the backend
    try {
      await taskApi.completeChecklistItem(itemId);
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  const deleteChecklistItem = async (itemId: string) => {
    try {
      await taskApi.deleteChecklistItem(itemId);
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  const addChecklistItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId || !newItemTitle.trim()) return;
    setAddingItem(true);
    try {
      await taskApi.addChecklistItem(taskId, newItemTitle);
      setNewItemTitle("");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setAddingItem(false);
    }
  };

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;
    setUploading(true);
    try {
      const res = await taskApi.addEvidence(taskId, file);
      setUploadedEvidence((prev) => [...prev, res.data.data]);
      show("Evidence uploaded", "success");
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteEvidence = async (fileId: string) => {
    if (!taskId) return;
    try {
      await taskApi.deleteEvidence(taskId, fileId);
      setUploadedEvidence((prev) => prev.filter((a) => a._id !== fileId));
      show("Evidence deleted", "success");
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  const changeStatus = async (status: string) => {
    if (!taskId) return;
    try {
      await taskApi.setStatus(taskId, status);
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  if (loading || !task) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <Link to={`/student/chapters/${task.chapter}`} className="text-sm text-brand-600 hover:underline">
        ← Back to chapter
      </Link>
      <PageHeader
        title={task.title}
        description={task.deadline ? `Due ${formatDate(task.deadline)}` : undefined}
        actions={
          <div className="w-44">
            <SelectField
              value={task.status}
              onChange={(e) => changeStatus(e.target.value)}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
          </div>
        }
      />

      {task.description && <p className="mb-4 text-sm text-gray-600">{task.description}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Checklist</h3>
          <div className="space-y-2">
            {task.checklist.length === 0 ? (
              <p className="text-sm text-gray-400">No checklist items yet.</p>
            ) : (
              task.checklist.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={() => toggleChecklistItem(item._id, item.isCompleted)}
                    />
                    <span className={item.isCompleted ? "text-gray-400 line-through" : "text-gray-800"}>{item.title}</span>
                  </label>
                  <button className="text-xs text-gray-400 hover:text-red-500" onClick={() => deleteChecklistItem(item._id)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
          <form onSubmit={addChecklistItem} className="mt-3 flex gap-2">
            <input
              className="input"
              placeholder="Add a checklist item…"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
            />
            <Button type="submit" variant="secondary" loading={addingItem} disabled={!newItemTitle.trim()}>
              Add
            </Button>
          </form>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Evidence</h3>
          <label className="mb-3 block">
            <span className="btn-secondary inline-flex cursor-pointer">
              {uploading ? "Uploading…" : "Upload evidence"}
            </span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleEvidenceUpload} disabled={uploading} />
          </label>
          {uploadedEvidence.length === 0 ? (
            <p className="text-sm text-gray-400">No evidence uploaded this session.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {uploadedEvidence.map((ev) => (
                <div key={ev._id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {ev.mimeType?.startsWith("video/") ? (
                    <div className="flex h-full items-center justify-center text-2xl">▶</div>
                  ) : (
                    <img src={ev.url} alt={ev.fileName ?? "evidence"} className="h-full w-full object-cover" />
                  )}
                  <button
                    onClick={() => deleteEvidence(ev._id)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
