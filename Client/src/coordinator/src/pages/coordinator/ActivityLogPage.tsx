import { useEffect, useState } from "react";
import { activityApi } from "@/api/misc";
import type { ActivityLogEntry } from "@/types";
import { PageHeader } from "@/components/ui/misc";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatRelative } from "@/utils/format";

export function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    activityApi.system(page, limit).then((res) => {
      setActivities(res.data.data.activities);
      setLoading(false);
    });
  }, [page]);

  return (
    <div>
      <PageHeader title="Activity Log" description="System-wide activity across all projects and users" />

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : activities.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <div className="card divide-y divide-gray-100">
          {activities.map((a) => (
            <div key={a._id} className="px-4 py-3 text-sm">
              <p className="text-gray-900">
                <span className="font-medium">{typeof a.actor === "object" ? a.actor.name : "Someone"}</span>{" "}
                {a.description ?? a.action.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-gray-400">{formatRelative(a.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* This feed endpoint doesn't return a total count, so pagination is
          simple prev/next rather than the numbered Pagination component. */}
      <div className="mt-3 flex justify-between">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={activities.length < limit} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
