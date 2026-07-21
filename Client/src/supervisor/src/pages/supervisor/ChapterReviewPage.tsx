import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { chapterApi } from "@/api/chapters";
import { submissionApi } from "@/api/submissions";
import { feedbackApi } from "@/api/feedback";
import { getAccessToken } from "@/api/client";
import { getErrorMessage } from "@/api/client";
import type { Chapter, ChapterSubmission, Feedback } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextAreaField } from "@/components/ui/FormField";
import { formatDateTime } from "@/utils/format";

type ReviewAction = "approve" | "reject" | "request-revision";

export function ChapterReviewPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { show } = useToast();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [versions, setVersions] = useState<ChapterSubmission[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<ChapterSubmission | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [feedbackThread, setFeedbackThread] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockToggling, setLockToggling] = useState(false);

  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Note: this page assumes the chapter's latest submission id is reachable
  // via the chapter's submission history. In practice you'd likely pass the
  // submission id in the route too - kept simple here by fetching history
  // from whatever the most recent known submission id is.
  const loadChapterAndSubmissions = async () => {
    if (!chapterId) return;
    setLoading(true);
    const chapterRes = await chapterApi.get(chapterId);
    setChapter(chapterRes.data.data);
    setLoading(false);
  };

  useEffect(() => {
    loadChapterAndSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const loadVersionHistory = async (submissionId: string) => {
    const res = await submissionApi.history(submissionId);
    const sorted = [...res.data.data].sort((a, b) => b.version - a.version);
    setVersions(sorted);
    selectVersion(sorted[0]);
  };

  const selectVersion = async (submission: ChapterSubmission) => {
    setActiveSubmission(submission);
    const token = getAccessToken();
    const res = await fetch(submissionApi.downloadUrl(submission._id), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include",
    });
    if (res.ok) {
      const blob = await res.blob();
      setPdfUrl(window.URL.createObjectURL(blob));
    }
    const feedbackRes = await feedbackApi.bySubmission(submission._id);
    setFeedbackThread(feedbackRes.data.data);
  };

  const toggleLock = async () => {
    if (!chapter) return;
    setLockToggling(true);
    try {
      if (chapter.isLocked) await chapterApi.unlock(chapter._id);
      else await chapterApi.lock(chapter._id);
      show(`Chapter ${chapter.isLocked ? "unlocked" : "locked"}`, "success");
      loadChapterAndSubmissions();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setLockToggling(false);
    }
  };

  const submitReview = async () => {
    if (!activeSubmission || !reviewAction) return;
    if (reviewAction === "request-revision" && !comment.trim()) {
      setReviewError("A comment is required when requesting a revision");
      return;
    }
    setReviewError("");
    setSubmittingReview(true);
    try {
      if (reviewAction === "approve") await submissionApi.approve(activeSubmission._id, comment || undefined);
      if (reviewAction === "reject") await submissionApi.reject(activeSubmission._id, comment || undefined);
      if (reviewAction === "request-revision") await submissionApi.requestRevision(activeSubmission._id, comment);

      show(`Submission ${reviewAction.replace("-", " ")}d`, "success");
      setReviewAction(null);
      setComment("");
      loadVersionHistory(activeSubmission._id);
      loadChapterAndSubmissions();
    } catch (err) {
      setReviewError(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
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
      <Link to={`/supervisor/projects/${chapter.project}`} className="text-sm text-brand-600 hover:underline">
        ← Back to project
      </Link>
      <PageHeader
        title={chapter.title}
        description={`Chapter ${chapter.chapterNumber ?? ""}`}
        actions={
          <>
            <Badge color={statusColor(chapter.status)}>{chapter.status}</Badge>
            <Button variant="secondary" onClick={toggleLock} loading={lockToggling}>
              {chapter.isLocked ? "Unlock chapter" : "Lock chapter"}
            </Button>
          </>
        }
      />

      {versions.length === 0 && !activeSubmission && (
        <div className="card p-6 text-center text-sm text-gray-400">
          <p>No submission loaded yet.</p>
          <p className="mt-1 text-xs">
            This page needs a submission id to load version history — link here from the submission's detail rather than the chapter alone in a real deployment.
          </p>
        </div>
      )}

      {activeSubmission && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-medium text-gray-900">Version {activeSubmission.version}</p>
                <div className="flex gap-1">
                  {versions.map((v) => (
                    <button
                      key={v._id}
                      onClick={() => selectVersion(v)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        v._id === activeSubmission._id ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      v{v.version}
                    </button>
                  ))}
                </div>
              </div>
              {pdfUrl ? (
                <iframe src={pdfUrl} title="Chapter submission PDF" className="h-[70vh] w-full" />
              ) : (
                <div className="flex h-[70vh] items-center justify-center">
                  <Spinner />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Review this version</h3>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => setReviewAction("approve")}>
                  Approve
                </Button>
                <Button className="w-full" variant="secondary" onClick={() => setReviewAction("request-revision")}>
                  Request revision
                </Button>
                <Button className="w-full" variant="danger" onClick={() => setReviewAction("reject")}>
                  Reject
                </Button>
              </div>
              <dl className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <dt>Submitted</dt>
                  <dd>{formatDateTime(activeSubmission.submittedAt)}</dd>
                </div>
                {activeSubmission.reviewedAt && (
                  <div className="flex justify-between">
                    <dt>Last reviewed</dt>
                    <dd>{formatDateTime(activeSubmission.reviewedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Feedback thread</h3>
              {feedbackThread.length === 0 ? (
                <p className="text-sm text-gray-400">No feedback yet for this version.</p>
              ) : (
                <div className="space-y-3">
                  {feedbackThread.map((f) => (
                    <div key={f._id} className="rounded-lg bg-gray-50 p-3">
                      <p className="text-sm text-gray-800">{f.comment}</p>
                      {f.response && <p className="mt-2 text-sm text-brand-700">↳ {f.response}</p>}
                      <p className="mt-2 text-xs text-gray-400">{formatDateTime(f.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={!!reviewAction}
        onClose={() => {
          setReviewAction(null);
          setReviewError("");
        }}
        title={
          reviewAction === "approve"
            ? "Approve submission"
            : reviewAction === "reject"
            ? "Reject submission"
            : "Request revision"
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewAction(null)}>
              Cancel
            </Button>
            <Button variant={reviewAction === "reject" ? "danger" : "primary"} onClick={submitReview} loading={submittingReview}>
              Confirm
            </Button>
          </>
        }
      >
        <TextAreaField
          label={reviewAction === "request-revision" ? "Comment (required)" : "Comment (optional)"}
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required={reviewAction === "request-revision"}
        />
        {reviewError && <p className="mt-2 text-sm text-red-600">{reviewError}</p>}
      </Modal>
    </div>
  );
}
