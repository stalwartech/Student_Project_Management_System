import { useEffect, useState } from "react";
import { assignmentApi, type SupervisorAssignment } from "@/api/assignments";
import { getErrorMessage } from "@/api/client";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export function MySupervisorPage() {
  const [assignment, setAssignment] = useState<SupervisorAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await assignmentApi.mySupervisor();
        setAssignment(response.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8" /></div>;

  if (error) return <div><PageHeader title="My Supervisor" /><p className="text-sm text-red-600">{error}</p></div>;
  if (!assignment?.supervisor) return <div><PageHeader title="My Supervisor" /><EmptyState title="No supervisor assigned yet" description="Your coordinator will assign a supervisor soon." /></div>;

  const { supervisor, session, projectTitle } = assignment;
  return (
    <div>
      <PageHeader title="My Supervisor" description="Your assigned supervisor and academic session" />
      <div className="max-w-2xl card p-6">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">{supervisor.name[0]?.toUpperCase()}</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{supervisor.title ? `${supervisor.title} ` : ""}{supervisor.name}</h2>
            <p className="text-sm text-gray-500">{supervisor.department}</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Email" value={supervisor.email} />
          <Detail label="Staff ID" value={supervisor.staffId ?? "—"} />
          <Detail label="Phone" value={supervisor.phone ?? "—"} />
          <Detail label="WhatsApp" value={supervisor.whatsapp ?? "—"} />
          <Detail label="Academic session" value={session ? <Badge color={session.isActive ? "green" : "gray"}>{session.session}</Badge> : "—"} />
          {projectTitle && <Detail label="Project" value={projectTitle} />}
        </dl>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt className="text-gray-500">{label}</dt><dd className="mt-1 text-gray-900">{value}</dd></div>;
}
