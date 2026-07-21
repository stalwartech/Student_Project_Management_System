import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { dashboardApi } from "@/api/misc";
import type { DashboardStats, DashboardCharts } from "@/types";
import { PageHeader } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/misc";

export function CoordinatorDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [statsRes, chartsRes] = await Promise.all([dashboardApi.stats(), dashboardApi.charts()]);
      setStats(statsRes.data.data);
      setCharts(chartsRes.data.data);
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

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={stats?.activeAcademicSession ? `Active session: ${stats.activeAcademicSession}` : "No active academic session"}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Students" value={stats?.totalStudents ?? 0} />
        <StatCard label="Total Supervisors" value={stats?.totalSupervisors ?? 0} />
        <StatCard label="Total Projects" value={stats?.totalProjects ?? 0} />
        <StatCard label="Active Projects" value={stats?.activeProjects ?? 0} />
        <StatCard label="Completed Projects" value={stats?.completedProjects ?? 0} />
        <StatCard
          label="Students Without Projects"
          value={stats?.studentsWithoutProjects ?? 0}
          hint="Consider running Auto Allocation"
        />
        <StatCard label="Pending Activation" value={stats?.studentsPendingActivation ?? 0} />
        <StatCard label="Pending Chapter Reviews" value={stats?.pendingChapterReviews ?? 0} />
        <StatCard label="Upcoming Meetings" value={stats?.upcomingMeetings ?? 0} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Project Completion Rate (by month)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts?.projectCompletionRate ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2456f5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Chapter Submission Trends</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts?.chapterSubmissionTrends ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4d7fff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
