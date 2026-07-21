import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

// Usage:
// <Table
//   columns={[{ header: "Name", render: (s) => s.name }, { header: "Email", render: (s) => s.email }]}
//   rows={students}
//   rowKey={(s) => s._id}
//   loading={isLoading}
//   emptyTitle="No students yet"
// />
export function Table<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = "No records found",
  emptyDescription,
  onRowClick,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="card divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse px-4 py-4">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.header} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 text-sm text-gray-700 ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
