import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentApi } from "@/api/students";
import { getErrorMessage } from "@/api/client";
import type { User } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/misc";
import { Table, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { TextField, SelectField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export function StudentsPage() {
  const { show } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activated, setActivated] = useState("");
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await studentApi.list({
        search: search || undefined,
        activated: activated ? (activated as "true" | "false") : undefined,
        page,
        limit,
      });
      setStudents(res.data.data.students);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activated]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const toggleStatus = async (student: User) => {
    try {
      if (student.isDeactivated) await studentApi.activate(student._id);
      else await studentApi.deactivate(student._id);
      show(`${student.name} ${student.isDeactivated ? "activated" : "deactivated"}`, "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  const columns: Column<User>[] = [
    { header: "Name", render: (s) => <Link to={`/coordinator/students/${s._id}`} className="font-medium text-brand-700 hover:underline">{s.name}</Link> },
    { header: "Matric", render: (s) => s.matric },
    { header: "Department", render: (s) => s.department },
    { header: "Level", render: (s) => s.level },
    { header: "Email", render: (s) => s.email },
    {
      header: "Status",
      render: (s) =>
        s.isDeactivated ? (
          <Badge color="red">Deactivated</Badge>
        ) : s.isActivated ? (
          <Badge color="green">Activated</Badge>
        ) : (
          <Badge color="amber">Pending activation</Badge>
        ),
    },
    {
      header: "Actions",
      render: (s) => (
        <button
          className="text-sm font-medium text-gray-500 hover:text-brand-600"
          onClick={() => toggleStatus(s)}
        >
          {s.isDeactivated ? "Activate" : "Deactivate"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Students"
        description="All imported students"
        actions={
          <Link to="/coordinator/import">
            <Button variant="secondary">Bulk Import</Button>
          </Link>
        }
      />

      <form onSubmit={handleSearchSubmit} className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <TextField placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <SelectField
            value={activated}
            onChange={(e) => {
              setActivated(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "true", label: "Activated" },
              { value: "false", label: "Pending activation" },
            ]}
            placeholder="All statuses"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <Table
        columns={columns}
        rows={students}
        rowKey={(s) => s._id}
        loading={loading}
        emptyTitle="No students found"
        emptyDescription="Import students via Bulk Import to get started."
      />
      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
    </div>
  );
}
