import { useEffect, useState } from "react";
import { meetingApi } from "@/api/meetings";
import { getErrorMessage } from "@/api/client";
import type { Meeting } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/utils/format";

export function MeetingsPage() {
  const { show } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await meetingApi.list();
    setMeetings(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleJoin = async (id: string) => {
    // Open the tab while this click is still a user gesture. Opening it after
    // the awaited API request is commonly treated as a popup and blocked.
    const meetingWindow = window.open("about:blank", "_blank");
    setJoining(id);
    try {
      const res = await meetingApi.join(id);
      const meetingURL = res.data.data.meetingURL;
      if (!meetingWindow) {
        window.open(meetingURL, "_blank", "noopener,noreferrer");
      } else {
        meetingWindow.location.replace(meetingURL);
      }
      load();
    } catch (err) {
      meetingWindow?.close();
      show(getErrorMessage(err), "error");
    } finally {
      setJoining(null);
    }
  };

  const upcoming = meetings.filter((m) => m.status === "scheduled" || m.status === "ongoing");
  const past = meetings.filter((m) => m.status === "completed" || m.status === "cancelled");

  return (
    <div>
      <PageHeader title="Meetings" />

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : meetings.length === 0 ? (
        <EmptyState title="No meetings yet" />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Upcoming</h2>
            <div className="card divide-y divide-gray-100">
              {upcoming.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Nothing scheduled.</p>
              ) : (
                upcoming.map((m) => (
                  <div key={m._id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.title}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(m.startedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={statusColor(m.status)}>{m.status}</Badge>
                      <Button onClick={() => handleJoin(m._id)} loading={joining === m._id}>
                        Join
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Past</h2>
            <div className="card divide-y divide-gray-100">
              {past.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">No past meetings.</p>
              ) : (
                past.map((m) => (
                  <div key={m._id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.title}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(m.startedAt)}</p>
                    </div>
                    <Badge color={statusColor(m.status)}>{m.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
