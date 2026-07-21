import { getAccessToken } from "@/api/client";
import { reportApi } from "@/api/misc";
import { REPORT_TYPES, type ReportType } from "@/types";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";

const REPORT_LABELS: Record<ReportType, string> = {
  students: "Student Report",
  supervisors: "Supervisor Report",
  projects: "Project Report",
  "academic-sessions": "Academic Session Report",
  "project-completion": "Project Completion Report",
  meetings: "Meeting Report",
  feedback: "Feedback Report",
};

const REPORT_DESCRIPTIONS: Record<ReportType, string> = {
  students: "All students with department, level, and activation status",
  supervisors: "All supervisors with department and title",
  projects: "All projects with status, completion, supervisor, and students",
  "academic-sessions": "All academic sessions and their active/date status",
  "project-completion": "Project completion percentages against deadlines",
  meetings: "All scheduled meetings with duration and status",
  feedback: "All feedback records across projects",
};

export function ReportsPage() {
  // Report downloads are direct file streams (not JSON), and the endpoint
  // requires the Bearer token - so instead of a plain <a href>, fetch with
  // the token attached and trigger a blob download.
  const download = async (type: ReportType, format: "csv" | "excel" | "pdf") => {
    const token = getAccessToken();
    const res = await fetch(reportApi.downloadUrl(type, format), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report.${format === "excel" ? "xlsx" : format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Reports" description="Export data as CSV, Excel, or PDF" />

      <div className="grid gap-4 md:grid-cols-2">
        {REPORT_TYPES.map((type) => (
          <div key={type} className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900">{REPORT_LABELS[type]}</h3>
            <p className="mt-1 text-xs text-gray-500">{REPORT_DESCRIPTIONS[type]}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => download(type, "csv")}>
                CSV
              </Button>
              <Button variant="secondary" onClick={() => download(type, "excel")}>
                Excel
              </Button>
              <Button variant="secondary" onClick={() => download(type, "pdf")}>
                PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
