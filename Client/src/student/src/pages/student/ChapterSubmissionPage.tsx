import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { chapterApi } from "@/api/chapters";
import { submissionApi } from "@/api/submissions";
import { feedbackApi } from "@/api/feedback";
import { getErrorMessage } from "@/api/client";
import type { Chapter, ChapterSubmission, Feedback } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dropzone } from "@/components/ui/Dropzone";
import { formatDateTime } from "@/utils/format";

export function ChapterSubmissionPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { show } = useToast();

  // KNOWN BACKEND GAP (same one flagged in the supervisor build): there's no
  // GET /chapters/:id/latest-submission, so on first load of an
  // already-submitted chapter this page has no submission id to fetch
  // history from. It works correctly once the student has interacted with
  // it in this session (create/addVersion both return the new submission,
  // which is used to load history going forward) but a page refresh loses
  // that link until a backend lookup-by-chapter endpoint exists.
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<ChapterSubmission | null>(null);
  const [history, setHistory] = useState<ChapterSubmission[]>([]);
  const [latestFeedback, setLatestFeedback] = useState<Feedback | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!chapterId) return;
    setLoading(true);
    const chapterRes = await chapterApi.get(chapterId);
    setChapter(chapterRes.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const loadHistoryFor = async (submissionId: string) => {
    const res = await submissionApi.history(submissionId);
    const sorted = [...res.data.data].sort((a, b) => b.version - a.version);
    setHistory(sorted);
    setLatestSubmission(sorted[0]);
    if (sorted[0].status === "revision_requested") {
      const feedbackRes = await feedbackApi.bySubmission(sorted[0]._id);
      setLatestFeedback(feedbackRes.data.data[feedbackRes.data.data.length - 1] ?? null);
    } else {
      setLatestFeedback(null);
    }
  };

  const handleUpload = async () => {
    if (!chapterId || !file) return;
    setUploading(true);
    try {
      const res = latestSubmission
        ? await submissionApi.addVersion(latestSubmission._id, file)
        : await submissionApi.create(chapterId, file);
      show(latestSubmission ? "New version submitted" : "Chapter submitted", "success");
      setFile(null);
      loadHistoryFor(res.data.data._id);
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  };

  if (loading || !chapter) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <Link to={`/student/chapters/${chapter._id}`} className="text-sm text-brand-600 hover:underline">
        ← Back to chapter
      </Link>
      <PageHeader title={`Submit: ${chapter.title}`} />

      {chapter.isLocked ? (
        <div className="card border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            This chapter is locked by your supervisor. You can't submit until it's unlocked.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {latestFeedback && (
              <div className="card border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Revision requested</p>
                <p className="mt-1 text-sm text-amber-900">{latestFeedback.comment}</p>
              </div>
            )}

            <div className="card p-5">
              <Dropzone accept=".pdf" hint="PDF up to 20MB" onFileSelected={setFile} selectedFileName={file?.name} />
              <Button className="mt-4" onClick={handleUpload} loading={uploading} disabled={!file}>
                {latestSubmission ? "Submit new version" : "Submit chapter"}
              </Button>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Version history</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No submissions yet.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((v) => (
                  <li key={v._id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span>v{v.version}</span>
                    <div className="flex items-center gap-2">
                      <Badge color={statusColor(v.status)}>{v.status.replace("_", " ")}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {history[0] && <p className="mt-3 text-xs text-gray-400">Last submitted {formatDateTime(history[0].submittedAt)}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
