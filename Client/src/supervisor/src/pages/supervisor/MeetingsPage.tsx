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

const toDateTimeLocal = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const toIsoDateTime = (value: string) => new Date(value).toISOString();
const statusLabel = (status: Meeting["status"]) => status.charAt(0).toUpperCase() + status.slice(1);

export function MeetingsPage() {
  const { show } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [rescheduling, setRescheduling] = useState<Meeting | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const form = useForm({ project: "", title: "", description: "", meetingURL: "", startedAt: "", endedAt: "" });

  const load = async () => {
    setLoading(true);
    const res = await meetingApi.list();
    setMeetings(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    projectApi.assigned().then((res) => setProjects(res.data.data));
    const refreshTimer = window.setInterval(load, 30_000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const closeModal = () => {
    setShowCreate(false);
    setRescheduling(null);
    setError("");
    form.reset();
  };

  const openReschedule = (meeting: Meeting) => {
    form.setValues({
      project: typeof meeting.project === "object" ? meeting.project._id : meeting.project,
      title: meeting.title,
      description: meeting.description ?? "",
      meetingURL: meeting.meetingURL,
      startedAt: toDateTimeLocal(meeting.startedAt),
      endedAt: toDateTimeLocal(meeting.endedAt),
    });
    setError("");
    setRescheduling(meeting);
    setShowCreate(true);
  };

  const handleSubmit = async () => {
    setError("");
    if (new Date(form.values.endedAt) <= new Date(form.values.startedAt)) {
      setError("The end date/time must be after the start date/time.");
      return;
    }
    setSaving(true);
    try {
      if (rescheduling) {
        await meetingApi.update(rescheduling._id, {
          title: form.values.title,
          description: form.values.description,
          meetingURL: form.values.meetingURL,
          startedAt: toIsoDateTime(form.values.startedAt),
          endedAt: toIsoDateTime(form.values.endedAt),
        });
        show("Meeting rescheduled", "success");
      } else {
        await meetingApi.create({
          ...form.values,
          startedAt: toIsoDateTime(form.values.startedAt),
          endedAt: toIsoDateTime(form.values.endedAt),
        });
        show("Meeting scheduled", "success");
      }
      closeModal();
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
    {
      header: "When",
      render: (m) => (
        <span>
          {formatDateTime(m.startedAt)} – {formatDateTime(m.endedAt)}
        </span>
      ),
    },
    { header: "Status", render: (m) => <Badge color={statusColor(m.status)}>{statusLabel(m.status)}</Badge> },
    {
      header: "Actions",
      render: (m) =>
        m.status !== "cancelled" ? (
          <div className="flex items-center gap-3">
            <button className="text-sm font-medium text-brand-600 hover:underline" onClick={() => openReschedule(m)}>
              Reschedule
            </button>
            {m.status === "scheduled" && (
              <button className="text-sm font-medium text-red-500 hover:underline" onClick={() => cancelMeeting(m._id)}>
                Cancel
              </button>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Meetings"
        description="Meetings you've scheduled or are attending"
        actions={
          <Button
            onClick={() => {
              setRescheduling(null);
              setError("");
              form.reset();
              setShowCreate(true);
            }}
          >
            Schedule meeting
          </Button>
        }
      />

      <Table columns={columns} rows={meetings} rowKey={(m) => m._id} loading={loading} emptyTitle="No meetings yet" />

      <Modal
        open={showCreate}
        onClose={closeModal}
        title={rescheduling ? "Reschedule meeting" : "Schedule a meeting"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              {rescheduling ? "Save schedule" : "Schedule"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!rescheduling && (
            <SelectField
              label="Project"
              value={form.values.project}
              onChange={form.update("project")}
              options={projects.map((p) => ({ value: p._id, label: p.title }))}
              placeholder="Select project"
              required
            />
          )}
          <TextField label="Title" value={form.values.title} onChange={form.update("title")} required />
          <TextAreaField label="Description" rows={3} value={form.values.description} onChange={form.update("description")} />
          <TextField
            label="Meeting URL"
            placeholder="https://meet.google.com/..."
            value={form.values.meetingURL}
            onChange={form.update("meetingURL")}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Start date & time" type="datetime-local" value={form.values.startedAt} onChange={form.update("startedAt")} required />
            <TextField label="End date & time" type="datetime-local" value={form.values.endedAt} onChange={form.update("endedAt")} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
