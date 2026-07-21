import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projectApi } from "@/api/projects";
import type { Project } from "@/types";
import { PageHeader } from "@/components/ui/misc";
import { Table, type Column } from "@/components/ui/Table";
import { Badge, statusColor } from "@/components/ui/Badge";
import { formatDate } from "@/utils/format";

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectApi.assigned().then((res) => {
      setProjects(res.data.data);
      setLoading(false);
    });
  }, []);

  const columns: Column<Project>[] = [
    {
      header: "Title",
      render: (p) => (
        <Link to={`/supervisor/projects/${p._id}`} className="font-medium text-brand-700 hover:underline">
          {p.title}
        </Link>
      ),
    },
    { header: "Type", render: (p) => p.projectType },
    { header: "Students", render: (p) => p.students.map((s) => s.name).join(", ") || "—" },
    { header: "Completion", render: (p) => `${p.completionPercentage}%` },
    { header: "Status", render: (p) => <Badge color={statusColor(p.status)}>{p.status}</Badge> },
    { header: "Deadline", render: (p) => formatDate(p.deadline) },
  ];

  return (
    <div>
      <PageHeader title="My Projects" description="Projects assigned to you" />
      <Table
        columns={columns}
        rows={projects}
        rowKey={(p) => p._id}
        loading={loading}
        emptyTitle="No projects assigned yet"
        emptyDescription="Your coordinator will assign projects to you."
      />
    </div>
  );
}
