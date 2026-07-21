import { useEffect, useState } from "react";
import { academicSessionApi } from "@/api/academicSessions";
import { getErrorMessage } from "@/api/client";
import type { AcademicSession } from "@/types";
import { useForm } from "@/hooks/useForm";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { Table, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/FormField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/utils/format";

export function AcademicSessionsPage() {
  const { show } = useToast();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<AcademicSession | null>(null);
  const [confirmAction, setConfirmAction] = useState<"activate" | "deactivate" | null>(null);

  const form = useForm({ session: "", startDate: "", endDate: "" });

  const load = async () => {
    setLoading(true);
    const res = await academicSessionApi.list();
    setSessions(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await academicSessionApi.create(form.values);
      show("Academic session created", "success");
      setShowCreate(false);
      form.reset();
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const activeSession = sessions.find((s) => s.isActive);

  const openConfirm = (session: AcademicSession, action: "activate" | "deactivate") => {
    setConfirmTarget(session);
    setConfirmAction(action);
  };

  const runConfirm = async () => {
    if (!confirmTarget || !confirmAction) return;
    try {
      if (confirmAction === "activate") await academicSessionApi.activate(confirmTarget._id);
      else await academicSessionApi.deactivate(confirmTarget._id);
      show(`Session ${confirmAction}d`, "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setConfirmTarget(null);
      setConfirmAction(null);
    }
  };

  const columns: Column<AcademicSession>[] = [
    { header: "Session", render: (s) => s.session },
    { header: "Start date", render: (s) => formatDate(s.startDate) },
    { header: "End date", render: (s) => formatDate(s.endDate) },
    { header: "Status", render: (s) => (s.isActive ? <Badge color="green">Active</Badge> : <Badge>Inactive</Badge>) },
    {
      header: "Actions",
      render: (s) =>
        s.isActive ? (
          <button className="text-sm font-medium text-gray-500 hover:text-red-600" onClick={() => openConfirm(s, "deactivate")}>
            Deactivate
          </button>
        ) : (
          <button className="text-sm font-medium text-brand-600 hover:underline" onClick={() => openConfirm(s, "activate")}>
            Activate
          </button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Academic Sessions"
        description="Only one session can be active at a time"
        actions={<Button onClick={() => setShowCreate(true)}>New Session</Button>}
      />

      <Table columns={columns} rows={sessions} rowKey={(s) => s._id} loading={loading} emptyTitle="No academic sessions yet" />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New academic session"
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
          <TextField label="Session name" placeholder="e.g. 2025/2026" value={form.values.session} onChange={form.update("session")} required />
          <TextField label="Start date" type="date" value={form.values.startDate} onChange={form.update("startDate")} required />
          <TextField label="End date" type="date" value={form.values.endDate} onChange={form.update("endDate")} required />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmAction === "activate" ? "Activate session?" : "Deactivate session?"}
        message={
          confirmAction === "activate"
            ? `Activating "${confirmTarget?.session}" will deactivate ${activeSession ? `"${activeSession.session}"` : "any other active session"}.`
            : `"${confirmTarget?.session}" will no longer accept new project assignments.`
        }
        confirmLabel={confirmAction === "activate" ? "Activate" : "Deactivate"}
        danger={confirmAction === "deactivate"}
        onConfirm={runConfirm}
        onCancel={() => {
          setConfirmTarget(null);
          setConfirmAction(null);
        }}
      />
    </div>
  );
}
