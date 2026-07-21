import { useEffect, useState } from "react";
import { feedbackApi } from "@/api/feedback";
import { projectApi } from "@/api/projects";
import { getErrorMessage } from "@/api/client";
import type { Feedback, Project, FeedbackStatus } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { SelectField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/utils/format";

export function FeedbackInboxPage() {
  const { show } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "">("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await feedbackApi.list({
      project: projectFilter || undefined,
      status: statusFilter || undefined,
    });
    setFeedback(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    projectApi.assigned().then((res) => setProjects(res.data.data));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFilter, statusFilter]);

  const updateStatus = async (item: Feedback, action: "resolve" | "reopen") => {
    try {
      if (action === "resolve") await feedbackApi.resolve(item._id);
      else await feedbackApi.reopen(item._id);
      show(`Feedback ${action === "resolve" ? "resolved" : "reopened"}`, "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Feedback Inbox" description="Review feedback across all your projects" />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-56">
          <SelectField
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            options={projects.map((p) => ({ value: p._id, label: p.title }))}
            placeholder="All projects"
          />
        </div>
        <div className="w-48">
          <SelectField
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | "")}
            options={[
              { value: "open", label: "Open" },
              { value: "resolved", label: "Resolved" },
              { value: "reopened", label: "Reopened" },
            ]}
            placeholder="All statuses"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : feedback.length === 0 ? (
        <EmptyState title="No feedback found" description="Feedback you leave on chapter submissions will show up here." />
      ) : (
        <div className="card divide-y divide-gray-100">
          {feedback.map((f) => (
            <div key={f._id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge color={statusColor(f.status)}>{f.status}</Badge>
                    <Badge color={f.priority === "High" ? "red" : f.priority === "Medium" ? "amber" : "gray"}>
                      {f.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-800">{f.comment}</p>
                  {f.response && <p className="mt-2 text-sm text-brand-700">Student response: {f.response}</p>}
                  <p className="mt-2 text-xs text-gray-400">{formatDateTime(f.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {f.status !== "resolved" ? (
                    <Button variant="secondary" onClick={() => updateStatus(f, "resolve")}>
                      Resolve
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={() => updateStatus(f, "reopen")}>
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
