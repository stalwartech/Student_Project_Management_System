import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { projectApi } from "@/api/projects";
import type { Project } from "@/types";
import { PageHeader } from "@/components/ui/misc";
import { Table, type Column } from "@/components/ui/Table";
import { Badge, statusColor } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { TextField, SelectField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/format";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed", "Archived"];

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectApi.list({
        search: search || undefined,
        status: status || undefined,
        page,
        limit,
      });
      setProjects(res.data.data.projects);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const columns: Column<Project>[] = [
    {
      header: "Title",
      render: (p) => (
        <Link to={`/coordinator/projects/${p._id}`} className="font-medium text-brand-700 hover:underline">
          {p.title}
        </Link>
      ),
    },
    { header: "Code", render: (p) => <span className="text-xs text-gray-400">{p.projectCode}</span> },
    { header: "Type", render: (p) => p.projectType },
    { header: "Status", render: (p) => <Badge color={statusColor(p.status)}>{p.status}</Badge> },
    { header: "Completion", render: (p) => `${p.completionPercentage}%` },
    { header: "Supervisor", render: (p) => p.supervisor?.name ?? <span className="text-gray-400">Unassigned</span> },
    { header: "Deadline", render: (p) => formatDate(p.deadline) },
  ];

  return (
    <div>
      <PageHeader title="Projects" description="All projects across academic sessions" />

      <form onSubmit={handleSearchSubmit} className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <TextField placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <SelectField
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            placeholder="All statuses"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <Table
        columns={columns}
        rows={projects}
        rowKey={(p) => p._id}
        loading={loading}
        emptyTitle="No projects yet"
        emptyDescription="Projects created by supervisors will appear here."
      />
      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
    </div>
  );
}
