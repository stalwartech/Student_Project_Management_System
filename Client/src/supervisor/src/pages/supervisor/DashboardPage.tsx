import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projectApi } from "@/api/projects";
import { meetingApi } from "@/api/meetings";
import { feedbackApi } from "@/api/feedback";
import type { Project, Meeting, Feedback } from "@/types";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, statusColor } from "@/components/ui/Badge";
import { formatDateTime } from "@/utils/format";

export function SupervisorDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [projectsRes, meetingsRes, feedbackRes] = await Promise.all([
        projectApi.assigned(),
        meetingApi.list(),
        feedbackApi.list({ status: "open" }),
      ]);
      setProjects(projectsRes.data.data);
      setMeetings(meetingsRes.data.data);
      setFeedback(feedbackRes.data.data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const totalStudents = projects.reduce((sum, p) => sum + p.students.length, 0);
  const upcomingMeetings = meetings
    .filter((m) => m.status === "scheduled" && (!m.startedAt || new Date(m.startedAt) >= new Date()))
    .sort((a, b) => new Date(a.startedAt ?? 0).getTime() - new Date(b.startedAt ?? 0).getTime());

  return (
    <div>
      <PageHeader title="Dashboard" description="Your assigned projects at a glance" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Assigned Projects" value={projects.length} />
        <StatCard label="Assigned Students" value={totalStudents} />
        <StatCard label="Open Feedback" value={feedback.length} />
        <StatCard label="Upcoming Meetings" value={upcomingMeetings.length} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Your projects</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-400">No projects assigned yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {projects.map((p) => (
                <li key={p._id} className="flex items-center justify-between py-2">
                  <Link to={`/supervisor/projects/${p._id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    {p.title}
                  </Link>
                  <Badge color={statusColor(p.status)}>{p.status}</Badge>
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

      {feedback.length > 0 && (
        <div className="mt-4 card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Open feedback awaiting response</h2>
          <ul className="divide-y divide-gray-100">
            {feedback.slice(0, 5).map((f) => (
              <li key={f._id} className="py-2 text-sm text-gray-700">
                {f.comment}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
