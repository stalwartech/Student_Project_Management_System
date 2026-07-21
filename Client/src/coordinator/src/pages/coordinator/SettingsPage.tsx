import { useEffect, useState } from "react";
import { settingsApi } from "@/api/misc";
import { getErrorMessage } from "@/api/client";
import type { Settings } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { TextField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export function SettingsPage() {
  const { show } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await settingsApi.get();
    setSettings(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsApi.update({
        defaultSupervisorLimit: settings.defaultSupervisorLimit,
        defaultStudentLimit: settings.defaultStudentLimit,
      });
      show("Settings updated", "success");
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleAutoAllocation = async () => {
    if (!settings) return;
    try {
      const res = await settingsApi.toggleAutoAllocation(!settings.autoAllocationEnabled);
      setSettings(res.data.data);
      show(`Auto-allocation ${res.data.data.autoAllocationEnabled ? "enabled" : "disabled"}`, "success");
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="System-wide defaults for allocation and workload limits" />

      <div className="card max-w-lg space-y-5 p-5">
        <TextField
          label="Default supervisor limit"
          type="number"
          value={String(settings.defaultSupervisorLimit)}
          onChange={(e) => setSettings({ ...settings, defaultSupervisorLimit: Number(e.target.value) })}
        />
        <p className="-mt-3 text-xs text-gray-400">
          Max projects per supervisor. Individual supervisors can be given an override on their profile page.
        </p>

        <TextField
          label="Default student limit"
          type="number"
          value={String(settings.defaultStudentLimit)}
          onChange={(e) => setSettings({ ...settings, defaultStudentLimit: Number(e.target.value) })}
        />
        <p className="-mt-3 text-xs text-gray-400">Max students per project (relevant for Group projects).</p>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Auto-Allocation Enabled</p>
            <p className="text-xs text-gray-400">Allow Smart Auto Allocation to be run from the Auto Allocation page.</p>
          </div>
          <button
            onClick={toggleAutoAllocation}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              settings.autoAllocationEnabled ? "bg-brand-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                settings.autoAllocationEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <Button onClick={handleSave} loading={saving}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
