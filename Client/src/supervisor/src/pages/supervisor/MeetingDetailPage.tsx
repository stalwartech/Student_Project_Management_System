import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { meetingApi } from "@/api/meetings";
import { getErrorMessage } from "@/api/client";
import type { Meeting } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/utils/format";

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const res = await meetingApi.get(id);
    setMeeting(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setAttendance = async (userId: string, status: "invited" | "joined" | "declined") => {
    if (!id) return;
    try {
      await meetingApi.markAttendance(id, userId, status);
      show("Attendance updated", "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  const complete = async () => {
    if (!id) return;
    try {
      await meetingApi.complete(id);
      show("Meeting marked complete", "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  if (loading || !meeting) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/supervisor/meetings" className="text-sm text-brand-600 hover:underline">
        ← Back to Meetings
      </Link>
      <PageHeader
        title={meeting.title}
        description={formatDateTime(meeting.startedAt)}
        actions={
          <>
            <Badge color={statusColor(meeting.status)}>{meeting.status}</Badge>
            {meeting.status !== "completed" && meeting.status !== "cancelled" && (
              <Button variant="secondary" onClick={complete}>
                Mark complete
              </Button>
            )}
            <a href={meeting.meetingURL} target="_blank" rel="noreferrer">
              <Button>Open meeting link</Button>
            </a>
          </>
        }
      />

      {meeting.description && <p className="mb-4 text-sm text-gray-600">{meeting.description}</p>}

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Attendance</h3>
        {meeting.attendees.length === 0 ? (
          <p className="text-sm text-gray-400">No attendees recorded.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {meeting.attendees.map((a, i) => {
              const attendeeUser = typeof a.user === "object" ? a.user : null;
              const userId = typeof a.user === "object" ? a.user._id : a.user;
              return (
                <li key={i} className="flex items-center justify-between py-3 text-sm">
                  <span>{attendeeUser?.name ?? userId}</span>
                  <div className="flex items-center gap-2">
                    <Badge color={a.status === "joined" ? "green" : a.status === "declined" ? "red" : "gray"}>{a.status}</Badge>
                    {a.status !== "joined" && (
                      <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setAttendance(userId, "joined")}>
                        Mark joined
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
