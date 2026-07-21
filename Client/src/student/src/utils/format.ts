import { format, formatDistanceToNow } from "date-fns";

export const formatDate = (value: string | undefined) => (value ? format(new Date(value), "dd MMM yyyy") : "—");

export const formatDateTime = (value: string | undefined) =>
  value ? format(new Date(value), "dd MMM yyyy, h:mm a") : "—";

export const formatRelative = (value: string | undefined) =>
  value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : "—";

export const toDateInputValue = (value: string | undefined) => (value ? value.slice(0, 10) : "");
