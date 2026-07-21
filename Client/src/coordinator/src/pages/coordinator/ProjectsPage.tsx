import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { projectApi } from "@/api/projects";
import { academicSessionApi } from "@/api/academicSessions";
import { getErrorMessage } from "@/api/client";
import type { Project, AcademicSession, ProjectType } from "@/types";
import { useForm } from "@/hooks/useForm";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Table, type Column } from "@/components/ui/Table";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/utils/format";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed", "Archived"];

export function ProjectsPage() {
  const { show } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const limit = 20;

  const form = useForm({
    title: "",
    description: "",
    projectType: "Individual" as ProjectType,
    academicSession: "",
    deadline: "",
    startDate: "",
    department: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectApi.list({
        search: search || undefined,
        status: status || undefined,
        page,
        limit,
      });
      setProjects(res.data.data.projects);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    academicSessionApi.list().then((res) => setSessions(res.data.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleCreate = async () => {
    setFormError("");
    setSaving(true);
    try {
      await projectApi.create(form.values);
      show("Project created", "success");
      setShowCreate(false);
      form.reset();
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Project>[] = [
    {
      header: "Title",
      render: (p) => (
        <Link to={`/coordinator/projects/${p._id}`} className="font-medium text-brand-700 hover:underline">
          {p.title}
        </Link>
      ),
    },
    { header: "Code", render: (p) => <span className="text-xs text-gray-400">{p.projectCode}</span> },
    { header: "Type", render: (p) => p.projectType },
    { header: "Status", render: (p) => <Badge color={statusColor(p.status)}>{p.status}</Badge> },
    { header: "Completion", render: (p) => `${p.completionPercentage}%` },
    { header: "Supervisor", render: (p) => p.supervisor?.name ?? <span className="text-gray-400">Unassigned</span> },
    { header: "Deadline", render: (p) => formatDate(p.deadline) },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        description="All projects across academic sessions"
        actions={<Button onClick={() => setShowCreate(true)}>New Project</Button>}
      />

      <form onSubmit={handleSearchSubmit} className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <TextField placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <SelectField
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            placeholder="All statuses"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <Table
        columns={columns}
        rows={projects}
        rowKey={(p) => p._id}
        loading={loading}
        emptyTitle="No projects yet"
        emptyDescription="Create your first project to get started."
      />
      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New project"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              Create project
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Title" value={form.values.title} onChange={form.update("title")} required />
          <TextAreaField label="Description" rows={3} value={form.values.description} onChange={form.update("description")} required />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Project type"
              value={form.values.projectType}
              onChange={form.update("projectType")}
              options={[
                { value: "Individual", label: "Individual" },
                { value: "Group", label: "Group" },
              ]}
              required
            />
            <SelectField
              label="Academic session"
              value={form.values.academicSession}
              onChange={form.update("academicSession")}
              options={sessions.map((s) => ({ value: s._id, label: s.session }))}
              placeholder="Select session"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Start date" type="date" value={form.values.startDate} onChange={form.update("startDate")} required />
            <TextField label="Deadline" type="date" value={form.values.deadline} onChange={form.update("deadline")} required />
          </div>
          <TextField label="Department" value={form.values.department} onChange={form.update("department")} />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <p className="text-xs text-gray-400">
            Supervisor and students can be assigned from the project's detail page after creation.
          </p>
        </div>
      </Modal>
    </div>
  );
}
