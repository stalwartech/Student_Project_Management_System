import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supervisorApi } from "@/api/supervisors";
import { getErrorMessage } from "@/api/client";
import type { User, SupervisorWorkload } from "@/types";
import { useForm } from "@/hooks/useForm";
import { useToast } from "@/context/ToastContext";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";

type Tab = "details" | "workload";

export function SupervisorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const [supervisor, setSupervisor] = useState<User | null>(null);
  const [workload, setWorkload] = useState<SupervisorWorkload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("details");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [limitInput, setLimitInput] = useState("");

  const form = useForm({ name: "", phone: "", whatsapp: "", department: "", title: "" });

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const res = await supervisorApi.get(id);
    setSupervisor(res.data.data);
    form.setValues({
      name: res.data.data.name,
      phone: res.data.data.phone ?? "",
      whatsapp: res.data.data.whatsapp ?? "",
      department: res.data.data.department,
      title: res.data.data.title ?? "",
    });
    setLoading(false);
  };

  const loadWorkload = async () => {
    if (!id) return;
    const res = await supervisorApi.workload(id);
    setWorkload(res.data.data);
    setLimitInput(String(res.data.data.limit));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (tab === "workload") loadWorkload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const toggleStatus = async () => {
    if (!supervisor) return;
    try {
      if (supervisor.isDeactivated) await supervisorApi.activate(supervisor._id);
      else await supervisorApi.deactivate(supervisor._id);
      show(`${supervisor.name} ${supervisor.isDeactivated ? "activated" : "deactivated"}`, "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  const saveEdits = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await supervisorApi.update(id, form.values);
      show("Supervisor updated", "success");
      setEditing(false);
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const saveLimit = async () => {
    if (!id) return;
    try {
      await supervisorApi.setLimit(id, Number(limitInput));
      show("Supervisor limit override saved", "success");
      loadWorkload();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  if (loading || !supervisor) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/coordinator/supervisors" className="text-sm text-brand-600 hover:underline">
        ← Back to Supervisors
      </Link>
      <PageHeader
        title={`${supervisor.title ? supervisor.title + " " : ""}${supervisor.name}`}
        description={supervisor.staffId}
        actions={
          <Button variant={supervisor.isDeactivated ? "primary" : "danger"} onClick={toggleStatus}>
            {supervisor.isDeactivated ? "Activate" : "Deactivate"}
          </Button>
        }
      />

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {(["details", "workload"] as Tab[]).map((t) => (
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

      {tab === "details" && (
        <div className="card max-w-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Details</h2>
            {!editing && (
              <button className="text-sm font-medium text-brand-600 hover:underline" onClick={() => setEditing(true)}>
                Edit
              </button>
            )}
          </div>

          {!editing ? (
            <dl className="space-y-3 text-sm">
              <Row label="Email" value={supervisor.email} />
              <Row label="Department" value={supervisor.department} />
              <Row label="Title" value={supervisor.title ?? "—"} />
              <Row label="Phone" value={supervisor.phone ?? "—"} />
              <Row label="WhatsApp" value={supervisor.whatsapp ?? "—"} />
            </dl>
          ) : (
            <div className="space-y-4">
              <TextField label="Name" value={form.values.name} onChange={form.update("name")} />
              <TextField label="Title" value={form.values.title} onChange={form.update("title")} />
              <TextField label="Department" value={form.values.department} onChange={form.update("department")} />
              <TextField label="Phone" value={form.values.phone} onChange={form.update("phone")} />
              <TextField label="WhatsApp" value={form.values.whatsapp} onChange={form.update("whatsapp")} />
              <div className="flex gap-2">
                <Button onClick={saveEdits} loading={saving}>
                  Save
                </Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "workload" && workload && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current load</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workload.currentLoad} / {workload.limit} projects
                </p>
              </div>
              {workload.exceeded && <Badge color="red">At capacity</Badge>}
            </div>

            <div className="mt-4 flex items-end gap-2">
              <div className="w-32">
                <TextField label="Limit override" type="number" value={limitInput} onChange={(e) => setLimitInput(e.target.value)} />
              </div>
              <Button variant="secondary" onClick={saveLimit}>
                Save limit
              </Button>
            </div>
          </div>

          <div className="card divide-y divide-gray-100">
            {workload.projects.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No projects assigned yet.</p>
            ) : (
              workload.projects.map((p) => (
                <div key={p._id} className="flex items-center justify-between px-4 py-3">
                  <Link to={`/coordinator/projects/${p._id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    {p.title}
                  </Link>
                  <Badge color={statusColor(p.status)}>{p.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  );
}
