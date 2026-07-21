import { useEffect, useState } from "react";
import { projectApi } from "@/api/projects";
import { feedbackApi } from "@/api/feedback";
import { getErrorMessage } from "@/api/client";
import type { Feedback } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/utils/format";

export function FeedbackPage() {
  const { show } = useToast();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const projectRes = await projectApi.myProject();
      const res = await feedbackApi.list({ project: projectRes.data.data._id });
      setFeedback(res.data.data);
    } catch {
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitReply = async (id: string) => {
    const response = replyDrafts[id];
    if (!response?.trim()) return;
    setReplying(id);
    try {
      await feedbackApi.reply(id, response);
      show("Reply sent", "success");
      setReplyDrafts((prev) => ({ ...prev, [id]: "" }));
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setReplying(null);
    }
  };

  return (
    <div>
      <PageHeader title="Feedback" description="Feedback from your supervisor on chapter submissions" />

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : feedback.length === 0 ? (
        <EmptyState title="No feedback yet" description="Feedback on your submissions will show up here." />
      ) : (
        <div className="space-y-3">
          {feedback.map((f) => (
            <div key={f._id} className="card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge color={statusColor(f.status)}>{f.status}</Badge>
                <Badge color={f.priority === "High" ? "red" : f.priority === "Medium" ? "amber" : "gray"}>{f.priority} priority</Badge>
              </div>
              <p className="text-sm text-gray-800">{f.comment}</p>
              <p className="mt-1 text-xs text-gray-400">{formatDateTime(f.createdAt)}</p>

              {f.response ? (
                <div className="mt-3 rounded-lg bg-brand-50 p-3">
                  <p className="text-xs font-semibold text-brand-700">Your response</p>
                  <p className="mt-1 text-sm text-brand-900">{f.response}</p>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    className="input"
                    placeholder="Write a response…"
                    value={replyDrafts[f._id] ?? ""}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [f._id]: e.target.value }))}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => submitReply(f._id)}
                    loading={replying === f._id}
                    disabled={!replyDrafts[f._id]?.trim()}
                  >
                    Reply
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
