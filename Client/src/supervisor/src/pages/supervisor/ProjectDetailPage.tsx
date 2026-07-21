import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { projectApi } from "@/api/projects";
import { chapterApi } from "@/api/chapters";
import { messageApi } from "@/api/misc";
import { getErrorMessage } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import type { Project, Chapter, Message } from "@/types";
import { useForm } from "@/hooks/useForm";
import { useToast } from "@/context/ToastContext";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField } from "@/components/ui/FormField";
import { formatDate, formatDateTime } from "@/utils/format";

type Tab = "overview" | "chapters" | "members" | "messages";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { show } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [lockToggling, setLockToggling] = useState(false);

  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);
  const chapterForm = useForm({ title: "", chapterNumber: "", deadline: "", priority: "Medium" });

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const res = await projectApi.get(id);
    setProject(res.data.data);
    setLoading(false);
  };

  const loadChapters = async () => {
    if (!id) return;
    const res = await chapterApi.list(id);
    setChapters(res.data.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (tab === "chapters") loadChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, id]);

  const toggleLock = async () => {
    if (!project) return;
    setLockToggling(true);
    try {
      if (project.isLocked) await projectApi.unlock(project._id);
      else await projectApi.lock(project._id);
      show(`Project ${project.isLocked ? "unlocked" : "locked"}`, "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setLockToggling(false);
    }
  };

  const handleCreateChapter = async () => {
    if (!id) return;
    setSavingChapter(true);
    try {
      await chapterApi.create({ ...chapterForm.values, project: id });
      show("Chapter created", "success");
      setShowCreateChapter(false);
      chapterForm.reset();
      loadChapters();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setSavingChapter(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/supervisor/projects" className="text-sm text-brand-600 hover:underline">
        ← Back to My Projects
      </Link>
      <PageHeader
        title={project.title}
        description={project.projectCode}
        actions={
          <>
            <Badge color={statusColor(project.status)}>{project.status}</Badge>
            <Button variant={project.isLocked ? "primary" : "secondary"} onClick={toggleLock} loading={lockToggling}>
              {project.isLocked ? "Unlock submissions" : "Lock submissions"}
            </Button>
            <Link to={`/supervisor/projects/${project._id}/tasks`}>
              <Button variant="secondary">View tasks</Button>
            </Link>
          </>
        }
      />

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {(["overview", "chapters", "members", "messages"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="card p-5">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <dt className="text-gray-500">Description</dt>
              <dd className="mt-1 text-gray-900">{project.description}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="mt-1 text-gray-900">{project.projectType}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Deadline</dt>
              <dd className="mt-1 text-gray-900">{formatDate(project.deadline)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Completion</dt>
              <dd className="mt-1 text-gray-900">{project.completionPercentage}%</dd>
            </div>
            <div>
              <dt className="text-gray-500">Submissions locked</dt>
              <dd className="mt-1 text-gray-900">{project.isLocked ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </div>
      )}

      {tab === "chapters" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateChapter(true)}>New chapter</Button>
          </div>
          <div className="card divide-y divide-gray-100">
            {chapters.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No chapters yet.</p>
            ) : (
              chapters.map((c) => (
                <Link
                  key={c._id}
                  to={`/supervisor/chapters/${c._id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.chapterNumber ? `${c.chapterNumber}. ` : ""}
                      {c.title}
                    </p>
                    {c.deadline && <p className="text-xs text-gray-400">Due {formatDate(c.deadline)}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.isLocked && <Badge color="gray">Locked</Badge>}
                    <Badge color={statusColor(c.status)}>{c.status}</Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Students ({project.students.length})</h3>
          {project.students.length === 0 ? (
            <p className="text-sm text-gray-400">No students assigned yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {project.students.map((s) => (
                <li key={s._id} className="py-2">
                  {s.name} <span className="text-gray-400">({s.matric})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "messages" && id && <ProjectGroupChat projectId={id} currentUserId={user?._id} />}

      <Modal
        open={showCreateChapter}
        onClose={() => setShowCreateChapter(false)}
        title="New chapter"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateChapter(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChapter} loading={savingChapter}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Title" value={chapterForm.values.title} onChange={chapterForm.update("title")} required />
          <TextField label="Chapter number" value={chapterForm.values.chapterNumber} onChange={chapterForm.update("chapterNumber")} />
          <TextField label="Deadline" type="date" value={chapterForm.values.deadline} onChange={chapterForm.update("deadline")} />
          <SelectField
            label="Priority"
            value={chapterForm.values.priority}
            onChange={chapterForm.update("priority")}
            options={[
              { value: "Low", label: "Low" },
              { value: "Medium", label: "Medium" },
              { value: "High", label: "High" },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

function ProjectGroupChat({ projectId, currentUserId }: { projectId: string; currentUserId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    messageApi.projectThread(projectId).then((res) => setMessages(res.data.data));
  }, [projectId]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await messageApi.send({ chatType: "Project Group", project: projectId, content: draft });
      setMessages((prev) => [...prev, res.data.data]);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card flex h-[60vh] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No messages yet in this project's group chat.</p>
        ) : (
          messages.map((m) => {
            const isMine = typeof m.sender === "string" ? m.sender === currentUserId : m.sender._id === currentUserId;
            const senderName = typeof m.sender === "string" ? "Someone" : m.sender.name;
            return (
              <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                  {!isMine && <p className="mb-0.5 text-xs font-semibold opacity-70">{senderName}</p>}
                  <p>{m.content}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? "text-brand-100" : "text-gray-400"}`}>{formatDateTime(m.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-3">
        <input className="input" placeholder="Message the project group…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button type="submit" loading={sending} disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
