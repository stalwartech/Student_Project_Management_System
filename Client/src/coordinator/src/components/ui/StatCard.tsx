import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
}

// Usage: <StatCard label="Total Students" value={142} hint="12 pending activation" />
export function StatCard({ label, value, icon, hint }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {icon && <span className="text-brand-500">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
