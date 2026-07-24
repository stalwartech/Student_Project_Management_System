import { useEffect, useState } from "react";
import { assignmentApi, type AssignedStudent } from "@/api/assignments";
import { getErrorMessage } from "@/api/client";
import { PageHeader } from "@/components/ui/misc";
import { Table, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

export function AssignedStudentsPage() {
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<AssignedStudent | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await assignmentApi.assignedStudents();
        setStudents(response.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: Column<AssignedStudent>[] = [
    { header: "Student", render: (student) => <button onClick={() => setSelectedStudent(student)} className="font-medium text-brand-700 hover:underline">{student.name}</button> },
    { header: "Matric number", render: (student) => student.matric ?? "—" },
    { header: "Department", render: (student) => student.department },
    { header: "Level", render: (student) => student.level ?? "—" },
    {
      header: "Session(s)",
      render: (student) => student.sessions.map((session) => (
        <div key={session._id} className="mb-1 last:mb-0">
          <Badge color={session.isActive ? "green" : "gray"}>{session.session}</Badge>
          {session.projectTitle && <span className="ml-2 text-xs text-gray-500">{session.projectTitle}</span>}
        </div>
      )),
    },
    { header: "Profile", render: (student) => <button onClick={() => setSelectedStudent(student)} className="font-medium text-brand-700 hover:underline">View profile</button> },
  ];

  return (
    <div>
      <PageHeader title="Assigned Students" description="Students assigned to you, including their academic sessions" />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Table columns={columns} rows={students} rowKey={(student) => student._id} loading={loading} emptyTitle="No students assigned yet" emptyDescription="Students assigned by the coordinator will appear here." />

      <Modal open={Boolean(selectedStudent)} onClose={() => setSelectedStudent(null)} title={selectedStudent?.name ?? "Student profile"}>
        {selectedStudent && (
          <dl className="space-y-3 text-sm">
            <ProfileRow label="Email" value={selectedStudent.email} />
            <ProfileRow label="Matric number" value={selectedStudent.matric ?? "—"} />
            <ProfileRow label="Department" value={selectedStudent.department} />
            <ProfileRow label="Level" value={selectedStudent.level ?? "—"} />
            <ProfileRow label="Gender" value={selectedStudent.gender ?? "—"} />
            <ProfileRow label="Phone" value={selectedStudent.phone ?? "—"} />
            <ProfileRow label="WhatsApp" value={selectedStudent.whatsapp ?? "—"} />
            <ProfileRow label="Academic session(s)" value={selectedStudent.sessions.map((session) => session.session).join(", ")} />
          </dl>
        )}
      </Modal>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0"><dt className="text-gray-500">{label}</dt><dd className="text-right text-gray-900">{value}</dd></div>;
}
