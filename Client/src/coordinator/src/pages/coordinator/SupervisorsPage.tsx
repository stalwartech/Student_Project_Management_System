import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supervisorApi } from "@/api/supervisors";
import { getErrorMessage } from "@/api/client";
import type { User } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Table, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { TextField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export function SupervisorsPage() {
  const { show } = useToast();
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await supervisorApi.list({ search: search || undefined, page, limit });
      setSupervisors(res.data.data.supervisors);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const toggleStatus = async (supervisor: User) => {
    try {
      if (supervisor.isDeactivated) await supervisorApi.activate(supervisor._id);
      else await supervisorApi.deactivate(supervisor._id);
      show(`${supervisor.name} ${supervisor.isDeactivated ? "activated" : "deactivated"}`, "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  const columns: Column<User>[] = [
    {
      header: "Name",
      render: (s) => (
        <Link to={`/coordinator/supervisors/${s._id}`} className="font-medium text-brand-700 hover:underline">
          {s.title ? `${s.title} ` : ""}
          {s.name}
        </Link>
      ),
    },
    { header: "Staff ID", render: (s) => s.staffId },
    { header: "Department", render: (s) => s.department },
    { header: "Email", render: (s) => s.email },
    {
      header: "Status",
      render: (s) => (s.isDeactivated ? <Badge color="red">Deactivated</Badge> : <Badge color="green">Active</Badge>),
    },
    {
      header: "Actions",
      render: (s) => (
        <button className="text-sm font-medium text-gray-500 hover:text-brand-600" onClick={() => toggleStatus(s)}>
          {s.isDeactivated ? "Activate" : "Deactivate"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Supervisors"
        description="All imported supervisors"
        actions={
          <Link to="/coordinator/import">
            <Button variant="secondary">Bulk Import</Button>
          </Link>
        }
      />

      <form onSubmit={handleSearchSubmit} className="mb-4 flex items-end gap-3">
        <div className="w-64">
          <TextField placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <Table
        columns={columns}
        rows={supervisors}
        rowKey={(s) => s._id}
        loading={loading}
        emptyTitle="No supervisors found"
        emptyDescription="Import supervisors via Bulk Import to get started."
      />
      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
    </div>
  );
}
