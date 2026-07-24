import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projectApi } from "@/api/projects";
import { chapterApi } from "@/api/chapters";
import type { Project, Chapter } from "@/types";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/utils/format";
import { useForm } from "@/hooks/useForm";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/FormField";

export function MyProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [noProject, setNoProject] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);
  const { show } = useToast();
  const chapterForm = useForm({ title: "", chapterNumber: "", deadline: "", priority: "Medium" });

  useEffect(() => {
    (async () => {
      try {
        const res = await projectApi.myProject();
        setProject(res.data.data);
        const chaptersRes = await chapterApi.list(res.data.data._id);
        setChapters(chaptersRes.data.data);
      } catch {
        setNoProject(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (noProject || !project) {
    return (
      <div>
        <PageHeader title="My Project" />
        <EmptyState title="No project assigned yet" description="Your coordinator will assign your project soon." />
      </div>
    );
  }

  const createChapter = async () => {
    setSavingChapter(true);
    try {
      await chapterApi.create({ ...chapterForm.values, project: project._id });
      show("Chapter created", "success");
      setShowCreateChapter(false);
      chapterForm.reset();
      const res = await chapterApi.list(project._id);
      setChapters(res.data.data);
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setSavingChapter(false);
    }
  };

  return (
    <div>
      <PageHeader title={project.title} description={project.projectCode} actions={<Badge color={statusColor(project.status)}>{project.status}</Badge>} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-700">{project.description}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="text-gray-900">{project.projectType}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Completion</dt>
              <dd className="text-gray-900">{project.completionPercentage}%</dd>
            </div>
            <div>
              <dt className="text-gray-500">Start date</dt>
              <dd className="text-gray-900">{formatDate(project.startDate)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Deadline</dt>
              <dd className="text-gray-900">{formatDate(project.deadline)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Supervisor</h3>
            {project.supervisor ? (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {project.supervisor.name[0]?.toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {project.supervisor.title} {project.supervisor.name}
                  </p>
                  <p className="text-xs text-gray-400">{project.supervisor.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Not assigned yet.</p>
            )}
          </div>

          {project.projectType === "Group" && (
            <div className="card p-5">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Teammates</h3>
              {project.students.length === 0 ? (
                <p className="text-sm text-gray-400">No teammates yet.</p>
              ) : (
                <ul className="space-y-1 text-sm text-gray-700">
                  {project.students.map((s) => (
                    <li key={s._id}>{s.name}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Chapters</h2>
          <Button onClick={() => setShowCreateChapter(true)} disabled={project.isLocked}>New chapter</Button>
        </div>
        {chapters.length === 0 ? (
          <p className="text-sm text-gray-400">No chapters yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {chapters.map((c) => (
              <li key={c._id} className="flex items-center justify-between py-2">
                <Link to={`/student/chapters/${c._id}`} className="text-sm font-medium text-brand-700 hover:underline">
                  {c.chapterNumber ? `${c.chapterNumber}. ` : ""}
                  {c.title}
                </Link>
                <div className="flex items-center gap-2">
                  {c.isLocked && <Badge color="gray">Locked</Badge>}
                  <Badge color={statusColor(c.status)}>{c.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={showCreateChapter}
        onClose={() => setShowCreateChapter(false)}
        title="New chapter"
        footer={<><Button variant="secondary" onClick={() => setShowCreateChapter(false)}>Cancel</Button><Button onClick={createChapter} loading={savingChapter}>Create</Button></>}
      >
        <div className="space-y-4">
          <TextField label="Title" value={chapterForm.values.title} onChange={chapterForm.update("title")} required />
          <TextField label="Chapter number" value={chapterForm.values.chapterNumber} onChange={chapterForm.update("chapterNumber")} />
          <TextField label="Deadline" type="date" value={chapterForm.values.deadline} onChange={chapterForm.update("deadline")} />
          <SelectField label="Priority" value={chapterForm.values.priority} onChange={chapterForm.update("priority")} options={[{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }]} />
        </div>
      </Modal>
    </div>
  );
}
