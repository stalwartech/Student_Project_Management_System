import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { allocationApi } from "@/api/allocation";
import type { ManualAllocationOptions } from "@/api/allocation";
import { getErrorMessage } from "@/api/client";
import type { AllocationResult } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SelectField } from "@/components/ui/FormField";

type SupervisorPlan = Record<string, string>;

export function AutoAllocationPage() {
  const { show } = useToast();
  const [preview, setPreview] = useState<AllocationResult | null>(null);
  const [committed, setCommitted] = useState<AllocationResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const [manualOptions, setManualOptions] = useState<ManualAllocationOptions | null>(null);
  const [supervisorPlan, setSupervisorPlan] = useState<SupervisorPlan | null>(null);
  const [loadingManualOptions, setLoadingManualOptions] = useState(false);
  const [savingSupervisorPlan, setSavingSupervisorPlan] = useState(false);
  const [manualError, setManualError] = useState("");
  const [readiness, setReadiness] = useState<{
    canRun: boolean;
    activeSession: string | null;
    unassignedStudents: number;
    supervisedProjects: number;
    supervisors: number;
    message: string | null;
  } | null>(null);

  const loadReadiness = async () => {
    try {
      const res = await allocationApi.readiness();
      setReadiness(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const loadManualOptions = async () => {
    setLoadingManualOptions(true);
    setManualError("");
    try {
      const res = await allocationApi.manualOptions();
      setManualOptions(res.data.data);
      setSupervisorPlan(null);
    } catch (err) {
      setManualOptions(null);
      setManualError(getErrorMessage(err));
    } finally {
      setLoadingManualOptions(false);
    }
  };

  useEffect(() => {
    loadReadiness();
    loadManualOptions();
  }, []);

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
      loadReadiness();
    }
  };

  const runCommit = async () => {
    setCommitting(true);
    try {
      const res = await allocationApi.run();
      setCommitted(res.data.data);
      setPreview(null);
      show(`${res.data.data.assigned ?? res.data.data.proposals.length} student(s) allocated`, "success");
      loadReadiness();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setCommitting(false);
    }
  };

  const createRandomSupervisorPlan = () => {
    if (!manualOptions || manualOptions.students.length === 0 || manualOptions.supervisors.length === 0) return;
    const shuffledStudents = shuffle(manualOptions.students.map((student) => student._id));
    const shuffledSupervisors = shuffle(manualOptions.supervisors.map((supervisor) => supervisor._id));
    const nextPlan: SupervisorPlan = {};
    shuffledStudents.forEach((studentId, index) => {
      nextPlan[studentId] = shuffledSupervisors[index % shuffledSupervisors.length];
    });
    setSupervisorPlan(nextPlan);
    setManualError("");
  };

  const saveSupervisorPlan = async () => {
    if (!supervisorPlan || !manualOptions) return;
    setSavingSupervisorPlan(true);
    setManualError("");
    try {
      const assignments = Object.entries(supervisorPlan).map(([studentId, supervisorId]) => ({ studentId, supervisorId }));
      const response = await allocationApi.saveSupervisorAllocations(assignments);
      show(`${response.data.data.saved} supervisor allocation(s) saved`, "success");
      await Promise.all([loadManualOptions(), loadReadiness()]);
    } catch (err) {
      setManualError(getErrorMessage(err));
    } finally {
      setSavingSupervisorPlan(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Allocation"
        description="Randomly distribute students to supervisors, review the preview, and save when ready"
        actions={
          <Button onClick={runPreview} loading={loadingPreview} disabled={readiness !== null && !readiness.canRun}>
            {preview ? "Refresh project preview" : "Preview project allocation"}
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {readiness && (
        <div className={`mb-4 card border p-4 ${readiness.canRun ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}>
          <p className="text-sm font-medium text-gray-900">
            {readiness.activeSession ? `Active session: ${readiness.activeSession}` : "No active academic session"}
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {readiness.unassignedStudents} unassigned student(s) • {readiness.supervisors} supervisor(s) • {readiness.supervisedProjects} project(s)
          </p>
          {readiness.message && <p className="mt-2 text-sm text-amber-800">{readiness.message}</p>}
        </div>
      )}

      <section className="mb-6 card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Allocate students to supervisors</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a balanced random allocation, review every pairing, and save only when you are satisfied.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadManualOptions} loading={loadingManualOptions}>Refresh list</Button>
            <Button onClick={createRandomSupervisorPlan} disabled={!manualOptions || manualOptions.students.length === 0 || manualOptions.supervisors.length === 0}>
              {supervisorPlan ? "Shuffle again" : "Allocate students to supervisors"}
            </Button>
          </div>
        </div>

        {manualError && <p className="mb-3 text-sm text-red-600">{manualError}</p>}

        {manualOptions && (
          <>
            {manualOptions.students.length === 0 || manualOptions.supervisors.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">A student and an active supervisor are required for manual allocation.</p>
            ) : !supervisorPlan ? (
              <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Click <span className="font-medium">Allocate students to supervisors</span> to generate a random preview. Nothing is saved until you click Save allocations.
              </p>
            ) : (
              <>
                <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Preview only — use a row’s supervisor selector to edit the randomized pairing, or open either profile to preview and edit its details. These allocations are not saved yet.
                </div>
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Supervisor</th><th className="px-4 py-3">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {manualOptions.students.map((student) => {
                        const supervisor = manualOptions.supervisors.find((item) => item._id === supervisorPlan[student._id]);
                        return (
                          <tr key={student._id}>
                            <td className="px-4 py-3"><p className="font-medium text-gray-900">{student.name}</p><p className="text-xs text-gray-500">{student.matric ?? student.email}</p></td>
                            <td className="min-w-64 px-4 py-3">
                              <SelectField
                                value={supervisorPlan[student._id] ?? ""}
                                onChange={(event) => setSupervisorPlan((current) => current ? { ...current, [student._id]: event.target.value } : current)}
                                options={manualOptions.supervisors.map((item) => ({ value: item._id, label: `${item.title ? `${item.title} ` : ""}${item.name}${item.staffId ? ` (${item.staffId})` : ""}` }))}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                              <Link className="font-medium text-brand-700 hover:underline" to={`/coordinator/students/${student._id}`}>Preview / edit student</Link>
                              {supervisor && <Link className="ml-3 font-medium text-brand-700 hover:underline" to={`/coordinator/supervisors/${supervisor._id}`}>Preview / edit supervisor</Link>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={saveSupervisorPlan} loading={savingSupervisorPlan}>Save allocations</Button>
                </div>
              </>
            )}
          </>
        )}
      </section>

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

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
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
                Student <span className="font-mono text-xs">{p.student}</span> → {p.project ? "Project" : "Supervisor"}{" "}
                <span className="font-mono text-xs">{p.project ?? p.supervisor}</span>
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
