import type { ReactNode } from "react";

type BadgeColor = "gray" | "green" | "amber" | "red" | "blue";

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
};

// Usage: <Badge color="green">Active</Badge>
export function Badge({ children, color = "gray" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_CLASSES[color]}`}>
      {children}
    </span>
  );
}

// Maps common status strings from the API to a sensible badge color, so
// pages don't each reinvent this switch statement.
export function statusColor(status: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    "Not Started": "gray",
    "In Progress": "blue",
    Completed: "green",
    Approved: "green",
    Archived: "gray",
    pending: "amber",
    approved: "green",
    rejected: "red",
    revision_requested: "amber",
    open: "amber",
    resolved: "green",
    reopened: "red",
    scheduled: "blue",
    ongoing: "amber",
    cancelled: "red",
  };
  return map[status] ?? "gray";
}
