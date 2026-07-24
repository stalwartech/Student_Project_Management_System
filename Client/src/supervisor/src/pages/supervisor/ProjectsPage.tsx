import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projectApi } from "@/api/projects";
import { getErrorMessage } from "@/api/client";
import type { Project, User } from "@/types";
import { useForm } from "@/hooks/useForm";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Table, type Column } from "@/components/ui/Table";
import { Badge, statusColor } from "@/components/ui/Badge";
import { formatDate } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextAreaField, TextField } from "@/components/ui/FormField";

type AvailableStudent = Pick<User, "_id" | "name" | "matric" | "email" | "department" | "level">;

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [projectLeader, setProjectLeader] = useState("");
  const { show } = useToast();
  const form = useForm({
    title: "",
    description: "",
    startDate: "",
    deadline: "",
    department: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectApi.assigned();
      setProjects(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = async () => {
    setShowCreate(true);
    setSelectedStudentIds([]);
    setProjectLeader("");
    setLoadingStudents(true);
    try {
      const response = await projectApi.availableStudents();
      setAvailableStudents(response.data.data.students);
    } catch (err) {
      show(getErrorMessage(err), "error");
      setAvailableStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((current) => {
      const next = current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId];
      if (projectLeader && !next.includes(projectLeader)) setProjectLeader("");
      return next;
    });
  };

  const handleCreate = async () => {
    if (selectedStudentIds.length === 0) {
      show("Select at least one student", "error");
      return;
    }
    if (selectedStudentIds.length > 1 && !projectLeader) {
      show("Choose a project leader for the group", "error");
      return;
    }
    setSaving(true);
    try {
      await projectApi.create({ ...form.values, studentIds: selectedStudentIds, projectLeader: selectedStudentIds.length > 1 ? projectLeader : undefined });
      show("Project created", "success");
      form.reset();
      setShowCreate(false);
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Project>[] = [
    {
      header: "Title",
      render: (p) => (
        <Link to={`/supervisor/projects/${p._id}`} className="font-medium text-brand-700 hover:underline">
          {p.title}
        </Link>
      ),
    },
    { header: "Type", render: (p) => p.projectType },
    { header: "Students", render: (p) => p.students.map((s) => s.name).join(", ") || "—" },
    { header: "Completion", render: (p) => `${p.completionPercentage}%` },
    { header: "Status", render: (p) => <Badge color={statusColor(p.status)}>{p.status}</Badge> },
    { header: "Deadline", render: (p) => formatDate(p.deadline) },
  ];

  return (
    <div>
      <PageHeader
        title="My Projects"
        description="Projects you supervise"
        actions={<Button onClick={openCreate}>New Project</Button>}
      />
      <Table
        columns={columns}
        rows={projects}
        rowKey={(p) => p._id}
        loading={loading}
        emptyTitle="No projects assigned yet"
        emptyDescription="Create your first project to get started."
      />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={loadingStudents || selectedStudentIds.length === 0 || (selectedStudentIds.length > 1 && !projectLeader)}>Create project</Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Title" value={form.values.title} onChange={form.update("title")} required />
          <TextAreaField label="Description" rows={3} value={form.values.description} onChange={form.update("description")} required />
          <div>
            <p className="label">Assigned students <span className="text-red-500">*</span></p>
            <p className="mb-2 text-xs text-gray-500">Select one student for an individual project or multiple students for a group project.</p>
            {loadingStudents ? (
              <p className="text-sm text-gray-500">Loading students assigned to you…</p>
            ) : availableStudents.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">No unprojected students are assigned to you in the active session.</p>
            ) : (
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3">
                {availableStudents.map((student) => (
                  <label key={student._id} className="flex cursor-pointer items-start gap-3 text-sm">
                    <input type="checkbox" checked={selectedStudentIds.includes(student._id)} onChange={() => toggleStudent(student._id)} className="mt-1" />
                    <span><span className="font-medium text-gray-900">{student.name}</span><span className="ml-2 text-xs text-gray-500">{student.matric ?? student.email}</span></span>
                  </label>
                ))}
              </div>
            )}
            {selectedStudentIds.length > 0 && <p className="mt-2 text-xs text-gray-500">{selectedStudentIds.length === 1 ? "Individual project" : `Group project (${selectedStudentIds.length} students)`}</p>}
          </div>
          {selectedStudentIds.length > 1 && (
            <SelectField
              label="Project leader"
              value={projectLeader}
              onChange={(event) => setProjectLeader(event.target.value)}
              placeholder="Choose a leader"
              options={availableStudents.filter((student) => selectedStudentIds.includes(student._id)).map((student) => ({ value: student._id, label: `${student.name}${student.matric ? ` (${student.matric})` : ""}` }))}
              required
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Start date" type="date" value={form.values.startDate} onChange={form.update("startDate")} required />
            <TextField label="Deadline" type="date" value={form.values.deadline} onChange={form.update("deadline")} required />
          </div>
          <TextField label="Department" value={form.values.department} onChange={form.update("department")} />
          <p className="text-xs text-gray-400">The project will be created in the active academic session.</p>
        </div>
      </Modal>
    </div>
  );
}
