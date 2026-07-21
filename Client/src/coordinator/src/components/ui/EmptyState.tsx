interface EmptyStateProps {
  title: string;
  description?: string;
}

// Usage: <EmptyState title="No projects yet" description="Create your first project to get started." />
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );
}
