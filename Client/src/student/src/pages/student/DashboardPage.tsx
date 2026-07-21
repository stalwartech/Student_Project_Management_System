import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projectApi } from "@/api/projects";
import { chapterApi } from "@/api/chapters";
import { meetingApi } from "@/api/meetings";
import type { Project, Chapter, Meeting } from "@/types";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, statusColor } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime } from "@/utils/format";

type Health = "On Track" | "Slightly Behind" | "At Risk";

// No backend field exists for project health yet (flagged in SCREENS.md) -
// this is a simple client-side heuristic based on deadline proximity vs.
// completion percentage. Replace with a real backend field if one gets added.
function deriveHealth(project: Project): Health {
  const daysLeft = (new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const totalDays = (new Date(project.deadline).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = totalDays > 0 ? Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100) ) : 0;
  const gap = expectedProgress - project.completionPercentage;
  if (gap > 25) return "At Risk";
  if (gap > 10) return "Slightly Behind";
  return "On Track";
}

const HEALTH_COLOR: Record<Health, "green" | "amber" | "red"> = {
  "On Track": "green",
  "Slightly Behind": "amber",
  "At Risk": "red",
};

export function StudentDashboardPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [noProject, setNoProject] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const projectRes = await projectApi.myProject();
        setProject(projectRes.data.data);
        const [chaptersRes, meetingsRes] = await Promise.all([
          chapterApi.list(projectRes.data.data._id),
          meetingApi.list(),
        ]);
        setChapters(chaptersRes.data.data);
        setMeetings(meetingsRes.data.data);
      } catch {
        setNoProject(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (noProject || !project) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <EmptyState title="No project assigned yet" description="Your coordinator will assign your project soon." />
      </div>
    );
  }

  const currentChapter = chapters.find((c) => c.status === "In Progress" || c.status === "Submitted") ?? chapters[0];
  const upcomingMeetings = meetings
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => new Date(a.startedAt ?? 0).getTime() - new Date(b.startedAt ?? 0).getTime());
  const health = deriveHealth(project);

  return (
    <div>
      <PageHeader title="Dashboard" description={project.title} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Completion" value={`${project.completionPercentage}%`} />
        <div className="card p-4">
          <p className="text-sm text-gray-500">Project health</p>
          <div className="mt-2">
            <Badge color={HEALTH_COLOR[health]}>{health}</Badge>
          </div>
        </div>
        <StatCard label="Current chapter" value={currentChapter?.title ?? "—"} />
        <StatCard label="Upcoming meetings" value={upcomingMeetings.length} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Chapters</h2>
          {chapters.length === 0 ? (
            <p className="text-sm text-gray-400">No chapters yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {chapters.map((c) => (
                <li key={c._id} className="flex items-center justify-between py-2">
                  <Link to={`/student/chapters/${c._id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    {c.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    {c.deadline && <span className="text-xs text-gray-400">Due {formatDate(c.deadline)}</span>}
                    <Badge color={statusColor(c.status)}>{c.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Upcoming meetings</h2>
          {upcomingMeetings.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcomingMeetings.slice(0, 5).map((m) => (
                <li key={m._id} className="py-2">
                  <p className="text-sm font-medium text-gray-900">{m.title}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(m.startedAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
