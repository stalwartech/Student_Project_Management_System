import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { studentApi } from "@/api/students";
import { getErrorMessage } from "@/api/client";
import type { User } from "@/types";
import { useToast } from "@/context/ToastContext";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const [student, setStudent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const res = await studentApi.get(id);
    setStudent(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleStatus = async () => {
    if (!student) return;
    try {
      if (student.isDeactivated) await studentApi.activate(student._id);
      else await studentApi.deactivate(student._id);
      show(`${student.name} ${student.isDeactivated ? "activated" : "deactivated"}`, "success");
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    }
  };

  if (loading || !student) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/coordinator/students" className="text-sm text-brand-600 hover:underline">
        ← Back to Students
      </Link>
      <PageHeader
        title={student.name}
        description={student.matric}
        actions={
          <Button variant={student.isDeactivated ? "primary" : "danger"} onClick={toggleStatus}>
            {student.isDeactivated ? "Activate" : "Deactivate"}
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Details</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Email" value={student.email} />
            <Row label="Department" value={student.department} />
            <Row label="Level" value={student.level ?? "—"} />
            <Row label="Gender" value={student.gender ?? "—"} />
            <Row label="Phone" value={student.phone ?? "—"} />
            <Row label="WhatsApp" value={student.whatsapp ?? "—"} />
            <Row
              label="Status"
              value={
                student.isDeactivated ? (
                  <Badge color="red">Deactivated</Badge>
                ) : student.isActivated ? (
                  <Badge color="green">Activated</Badge>
                ) : (
                  <Badge color="amber">Pending activation</Badge>
                )
              }
            />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  );
}
