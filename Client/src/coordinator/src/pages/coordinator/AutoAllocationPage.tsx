import { useState } from "react";
import { allocationApi } from "@/api/allocation";
import { getErrorMessage } from "@/api/client";
import type { AllocationResult } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function AutoAllocationPage() {
  const { show } = useToast();
  const [preview, setPreview] = useState<AllocationResult | null>(null);
  const [committed, setCommitted] = useState<AllocationResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");

  const runPreview = async () => {
    setError("");
    setCommitted(null);
    setLoadingPreview(true);
    try {
      const res = await allocationApi.preview();
      setPreview(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingPreview(false);
    }
  };

  const runCommit = async () => {
    setCommitting(true);
    try {
      const res = await allocationApi.run();
      setCommitted(res.data.data);
      setPreview(null);
      show(`${res.data.data.assigned ?? res.data.data.proposals.length} student(s) allocated`, "success");
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Auto Allocation"
        description="Smart Auto Allocation assigns unassigned students in the active session to projects with capacity"
        actions={
          <Button onClick={runPreview} loading={loadingPreview}>
            {preview ? "Refresh preview" : "Preview allocation"}
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!preview && !committed && (
        <EmptyState
          title="No preview yet"
          description="Run a preview first to see proposed assignments before anything is saved."
        />
      )}

      {preview && (
        <div className="space-y-4">
          <div className="card border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              This is a preview only — nothing has been saved. Review the proposed assignments below, then confirm to
              run it for real.
            </p>
          </div>

          <ResultTables result={preview} />

          <div className="flex justify-end">
            <Button onClick={runCommit} loading={committing} disabled={preview.proposals.length === 0}>
              Confirm & run allocation
            </Button>
          </div>
        </div>
      )}

      {committed && (
        <div className="space-y-4">
          <div className="card border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">Allocation complete and saved.</p>
          </div>
          <ResultTables result={committed} />
        </div>
      )}
    </div>
  );
}

function ResultTables({ result }: { result: AllocationResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Proposed assignments ({result.proposals.length})
        </h3>
        {result.proposals.length === 0 ? (
          <p className="text-sm text-gray-400">No students could be assigned.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {result.proposals.map((p, i) => (
              <li key={i} className="py-2 text-gray-700">
                Student <span className="font-mono text-xs">{p.student}</span> → Project{" "}
                <span className="font-mono text-xs">{p.project}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Skipped ({result.skipped.length})</h3>
        {result.skipped.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing was skipped.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {result.skipped.map((s, i) => (
              <li key={i} className="py-2 text-gray-700">
                <span className="font-mono text-xs">{s.student}</span> — {s.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
