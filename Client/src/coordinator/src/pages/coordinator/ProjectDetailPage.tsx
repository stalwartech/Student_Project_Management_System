import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { projectApi } from "@/api/projects";
import { supervisorApi } from "@/api/supervisors";
import { studentApi } from "@/api/students";
import { getErrorMessage } from "@/api/client";
import type { Project, User, ActivityLogEntry, AssignStudentResult } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/FormField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate, formatRelative } from "@/utils/format";

type Tab = "overview" | "members" | "timeline" | "activity";

interface Chapter {
  _id: string;
  title: string;
  status: string;
  chapterNumber?: string;
  deadline?: string;
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<Chapter[]>([]);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  const [showAssignSupervisor, setShowAssignSupervisor] = useState(false);
  const [supervisorOptions, setSupervisorOptions] = useState<User[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [assigningSupervisor, setAssigningSupervisor] = useState(false);

  const [showAssignStudents, setShowAssignStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assigningStudents, setAssigningStudents] = useState(false);
  const [conflicts, setConflicts] = useState<AssignStudentResult["conflicts"]>([]);

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const res = await projectApi.get(id);
    setProject(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (tab === "timeline") projectApi.timeline(id).then((res) => setTimeline(res.data.data as Chapter[]));
    if (tab === "activity") projectApi.activity(id).then((res) => setActivities(res.data.data.activities));
  }, [tab, id]);

  useEffect(() => {
    if (studentSearch.trim().length < 2) {
      setStudentOptions([]);
      return;
    }
    const timeout = setTimeout(() => {
      studentApi.list({ search: studentSearch, activated: "true", limit: 8 }).then((res) => setStudentOptions(res.data.data.students));
    }, 300);
    return () => clearTimeout(timeout);
  }, [studentSearch]);

  const openAssignSupervisor = async () => {
    const res = await supervisorApi.list({ limit: 100 });
    setSupervisorOptions(res.data.data.supervisors);
    setSelectedSupervisor(project?.supervisor?._id ?? "");
    setShowAssignSupervisor(true);
  };

  const handleAssignSupervisor = async () => {
    if (!id || !selectedSupervisor) return;
    setAssigningSupervisor(true);
    try {
      const isChange = !!project?.supervisor;
      const res = isChange
        ? await projectApi.changeSupervisor(id, selectedSupervisor)
        : await projectApi.assignSupervisor(id, selectedSupervisor);
      if (res.data.data.workloadWarning) {
        show(res.data.data.workloadWarning, "info");
      } else {
        show("Supervisor assigned", "success");
      }
      setShowAssignSupervisor(false);
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setAssigningSupervisor(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => (prev.includes(studentId) ? prev.filter((s) => s !== studentId) : [...prev, studentId]));
  };

  const submitStudentAssignment = async (force?: "keep" | "reassign" | "skip", forStudentIds?: string[]) => {
    if (!id) return;
    setAssigningStudents(true);
    try {
      const ids = forStudentIds ?? selectedStudents;
      const res = await projectApi.assignStudents(id, ids, force);
      if (res.data.data.conflicts.length > 0) {
        setConflicts(res.data.data.conflicts);
      } else {
        show(`${res.data.data.assigned.length} student(s) assigned`, "success");
        setShowAssignStudents(false);
        setSelectedStudents([]);
        setConflicts([]);
        load();
      }
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setAssigningStudents(false);
    }
  };

  const resolveConflict = async (studentId: string, force: "keep" | "reassign" | "skip") => {
    await submitStudentAssignment(force, [studentId]);
    setConflicts((prev) => prev.filter((c) => c.studentId !== studentId));
    if (conflicts.length <= 1) {
      show("Student assignment resolved", "success");
      setShowAssignStudents(false);
      load();
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!id) return;
    try {
      await projectApi.removeStudent(id, studentId);
      show("Student removed", "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await projectApi.remove(id);
      show("Project deleted", "success");
      navigate("/coordinator/projects");
    } catch (err) {
      show(getErrorMessage(err), "error");
      setShowDelete(false);
    } finally {
      setDeleting(false);
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
      <Link to="/coordinator/projects" className="text-sm text-brand-600 hover:underline">
        ← Back to Projects
      </Link>
      <PageHeader
        title={project.title}
        description={project.projectCode}
        actions={
          <>
            <Badge color={statusColor(project.status)}>{project.status}</Badge>
            <Button variant="danger" onClick={() => setShowDelete(true)}>
              Delete
            </Button>
          </>
        }
      />

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {(["overview", "members", "timeline", "activity"] as Tab[]).map((t) => (
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
            <div>
              <dt className="text-gray-500">Description</dt>
              <dd className="mt-1 text-gray-900">{project.description}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="mt-1 text-gray-900">{project.projectType}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Start date</dt>
              <dd className="mt-1 text-gray-900">{formatDate(project.startDate)}</dd>
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
              <dt className="text-gray-500">Locked</dt>
              <dd className="mt-1 text-gray-900">{project.isLocked ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Supervisor</h3>
              <Button variant="secondary" onClick={openAssignSupervisor}>
                {project.supervisor ? "Change supervisor" : "Assign supervisor"}
              </Button>
            </div>
            {project.supervisor ? (
              <p className="text-sm text-gray-700">
                {project.supervisor.title} {project.supervisor.name} — {project.supervisor.email}
              </p>
            ) : (
              <p className="text-sm text-gray-400">No supervisor assigned yet.</p>
            )}
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Students ({project.students.length})</h3>
              <Button variant="secondary" onClick={() => setShowAssignStudents(true)}>
                Assign students
              </Button>
            </div>
            {project.students.length === 0 ? (
              <p className="text-sm text-gray-400">No students assigned yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {project.students.map((s) => (
                  <li key={s._id} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      {s.name} <span className="text-gray-400">({s.matric})</span>
                    </span>
                    <button className="text-xs font-medium text-red-500 hover:underline" onClick={() => removeStudent(s._id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "timeline" && (
        <div className="card divide-y divide-gray-100">
          {timeline.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">No chapters created yet for this project.</p>
          ) : (
            timeline.map((c) => (
              <div key={c._id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {c.chapterNumber ? `${c.chapterNumber}. ` : ""}
                    {c.title}
                  </p>
                  {c.deadline && <p className="text-xs text-gray-400">Due {formatDate(c.deadline)}</p>}
                </div>
                <Badge color={statusColor(c.status)}>{c.status}</Badge>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="card divide-y divide-gray-100">
          {activities.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">No activity recorded yet.</p>
          ) : (
            activities.map((a) => (
              <div key={a._id} className="px-4 py-3 text-sm">
                <p className="text-gray-900">
                  <span className="font-medium">{typeof a.actor === "object" ? a.actor.name : "Someone"}</span>{" "}
                  {a.description ?? a.action.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-gray-400">{formatRelative(a.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assign supervisor modal */}
      <Modal
        open={showAssignSupervisor}
        onClose={() => setShowAssignSupervisor(false)}
        title="Assign supervisor"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAssignSupervisor(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignSupervisor} loading={assigningSupervisor} disabled={!selectedSupervisor}>
              Assign
            </Button>
          </>
        }
      >
        <SelectField
          label="Supervisor"
          value={selectedSupervisor}
          onChange={(e) => setSelectedSupervisor(e.target.value)}
          options={supervisorOptions.map((s) => ({ value: s._id, label: `${s.title ?? ""} ${s.name}`.trim() }))}
          placeholder="Select a supervisor"
        />
        <p className="mt-2 text-xs text-gray-400">
          If this supervisor is already at their project limit, you'll see a warning after assigning — it won't block the action.
        </p>
      </Modal>

      {/* Assign students modal */}
      <Modal
        open={showAssignStudents}
        onClose={() => {
          setShowAssignStudents(false);
          setConflicts([]);
        }}
        title="Assign students"
        size="lg"
        footer={
          conflicts.length === 0 ? (
            <>
              <Button variant="secondary" onClick={() => setShowAssignStudents(false)}>
                Cancel
              </Button>
              <Button onClick={() => submitStudentAssignment()} loading={assigningStudents} disabled={selectedStudents.length === 0}>
                Assign {selectedStudents.length > 0 ? `(${selectedStudents.length})` : ""}
              </Button>
            </>
          ) : undefined
        }
      >
        {conflicts.length === 0 ? (
          <div>
            <TextField
              placeholder="Search activated students by name…"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
              {studentOptions.map((s) => (
                <label key={s._id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s._id)}
                    onChange={() => toggleStudentSelection(s._id)}
                  />
                  {s.name} <span className="text-gray-400">({s.matric})</span>
                </label>
              ))}
              {studentSearch.length >= 2 && studentOptions.length === 0 && (
                <p className="px-2 py-4 text-center text-sm text-gray-400">No matching students found.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {conflicts.length} student(s) are already assigned to another project this session. Choose how to handle each:
            </p>
            {conflicts.map((c) => (
              <div key={c.studentId} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-gray-800">
                  Already on <span className="font-medium">"{c.existingProjectTitle}"</span>
                </p>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary" onClick={() => resolveConflict(c.studentId, "keep")}>
                    Keep existing
                  </Button>
                  <Button variant="secondary" onClick={() => resolveConflict(c.studentId, "reassign")}>
                    Reassign here
                  </Button>
                  <Button variant="ghost" onClick={() => resolveConflict(c.studentId, "skip")}>
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={showDelete}
        title="Delete this project?"
        message="This can't be undone. If any chapters already exist for this project, deletion will be blocked - archive it instead."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
