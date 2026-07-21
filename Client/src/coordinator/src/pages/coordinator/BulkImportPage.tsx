import { useState } from "react";
import { importApi } from "@/api/import";
import { getErrorMessage } from "@/api/client";
import type { ImportSummary } from "@/types";
import { PageHeader } from "@/components/ui/misc";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Tab = "students" | "supervisors";

const REQUIRED_COLUMNS: Record<Tab, string[]> = {
  students: ["Full Name", "Matric Number", "Email Address", "Gender", "Level", "Department", "Phone Number (optional)", "WhatsApp Number (optional)"],
  supervisors: ["Title", "Full Name", "Staff ID", "Department", "Email Address", "Gender", "Phone Number (optional)", "WhatsApp Number (optional)"],
};

export function BulkImportPage() {
  const [tab, setTab] = useState<Tab>("students");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const switchTab = (t: Tab) => {
    setTab(t);
    setFile(null);
    setSummary(null);
    setError("");
  };

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = tab === "students" ? await importApi.students(file) : await importApi.supervisors(file);
      setSummary(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Bulk Import" description="Import students or supervisors from a CSV file" />

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {(["students", "supervisors"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Dropzone accept=".csv" hint="CSV up to 5MB" onFileSelected={setFile} selectedFileName={file?.name} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={handleImport} loading={uploading} disabled={!file}>
            Import {tab}
          </Button>

          {summary && <ImportSummaryView summary={summary} />}
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-900">Required columns</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
            {REQUIRED_COLUMNS[tab].map((col) => (
              <li key={col} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                {col}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-400">
            First row must be a header row with these exact column names.
          </p>
        </div>
      </div>
    </div>
  );
}

function ImportSummaryView({ summary }: { summary: ImportSummary }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Import summary</h3>

      <div className="mb-4 grid grid-cols-4 gap-3 text-center">
        <SummaryStat label="Imported" count={summary.imported.length} color="green" />
        <SummaryStat label="Duplicates" count={summary.duplicates.length} color="amber" />
        <SummaryStat label="Invalid" count={summary.invalid.length} color="red" />
        <SummaryStat label="Missing fields" count={summary.missing.length} color="red" />
      </div>

      {summary.imported.length > 0 && (
        <SummarySection title="Successfully imported" color="green">
          {summary.imported.map((r) => (
            <p key={r.id} className="text-sm text-gray-700">
              {r.name} — {r.email}
            </p>
          ))}
        </SummarySection>
      )}

      {summary.duplicates.length > 0 && (
        <SummarySection title="Duplicate records" color="amber">
          {summary.duplicates.map((r, i) => (
            <p key={i} className="text-sm text-gray-700">
              Row {r.row}: {r.email ?? r.matric ?? r.staffId}
            </p>
          ))}
        </SummarySection>
      )}

      {summary.invalid.length > 0 && (
        <SummarySection title="Invalid records" color="red">
          {summary.invalid.map((r, i) => (
            <p key={i} className="text-sm text-gray-700">
              Row {r.row}: {r.reason}
            </p>
          ))}
        </SummarySection>
      )}

      {summary.missing.length > 0 && (
        <SummarySection title="Missing information" color="red">
          {summary.missing.map((r, i) => (
            <p key={i} className="text-sm text-gray-700">
              Row {r.row}: missing {r.missingFields?.join(", ")}
            </p>
          ))}
        </SummarySection>
      )}
    </div>
  );
}

function SummaryStat({ label, count, color }: { label: string; count: number; color: "green" | "amber" | "red" }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-gray-900">{count}</p>
      <Badge color={color}>{label}</Badge>
    </div>
  );
}

function SummarySection({ title, color, children }: { title: string; color: "green" | "amber" | "red"; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${color === "green" ? "text-emerald-600" : color === "amber" ? "text-amber-600" : "text-red-600"}`}>
        {title}
      </p>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-gray-50 p-3">{children}</div>
    </div>
  );
}
