import { Button } from "./Button";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

// Usage: <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages} &middot; {total} total
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
