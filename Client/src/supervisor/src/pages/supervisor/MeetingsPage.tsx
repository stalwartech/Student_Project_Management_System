import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { meetingApi } from "@/api/meetings";
import { projectApi } from "@/api/projects";
import { getErrorMessage } from "@/api/client";
import type { Meeting, Project } from "@/types";
import { useForm } from "@/hooks/useForm";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Table, type Column } from "@/components/ui/Table";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import { formatDateTime } from "@/utils/format";

export function MeetingsPage() {
  const { show } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const form = useForm({ project: "", title: "", description: "", meetingURL: "", startedAt: "" });

  const load = async () => {
    setLoading(true);
    const res = await meetingApi.list();
    setMeetings(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    projectApi.assigned().then((res) => setProjects(res.data.data));
  }, []);

  const handleCreate = async () => {
    setError("");
    setSaving(true);
    try {
      await meetingApi.create(form.values);
      show("Meeting scheduled", "success");
      setShowCreate(false);
      form.reset();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const cancelMeeting = async (id: string) => {
    try {
      await meetingApi.cancel(id);
      show("Meeting cancelled", "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  const columns: Column<Meeting>[] = [
    {
      header: "Title",
      render: (m) => (
        <Link to={`/supervisor/meetings/${m._id}`} className="font-medium text-brand-700 hover:underline">
          {m.title}
        </Link>
      ),
    },
    { header: "Project", render: (m) => (typeof m.project === "object" ? m.project.title : "—") },
    { header: "When", render: (m) => formatDateTime(m.startedAt) },
    { header: "Status", render: (m) => <Badge color={statusColor(m.status)}>{m.status}</Badge> },
    {
      header: "Actions",
      render: (m) =>
        m.status === "scheduled" ? (
          <button className="text-sm font-medium text-red-500 hover:underline" onClick={() => cancelMeeting(m._id)}>
            Cancel
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="Meetings" description="Meetings you've scheduled or are attending" actions={<Button onClick={() => setShowCreate(true)}>Schedule meeting</Button>} />

      <Table columns={columns} rows={meetings} rowKey={(m) => m._id} loading={loading} emptyTitle="No meetings yet" />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Schedule a meeting"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField
            label="Project"
            value={form.values.project}
            onChange={form.update("project")}
            options={projects.map((p) => ({ value: p._id, label: p.title }))}
            placeholder="Select project"
            required
          />
          <TextField label="Title" value={form.values.title} onChange={form.update("title")} required />
          <TextAreaField label="Description" rows={3} value={form.values.description} onChange={form.update("description")} />
          <TextField
            label="Meeting URL"
            placeholder="https://meet.google.com/..."
            value={form.values.meetingURL}
            onChange={form.update("meetingURL")}
            required
          />
          <TextField label="Date & time" type="datetime-local" value={form.values.startedAt} onChange={form.update("startedAt")} />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
