import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDateValue(value?: string) {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3])
    ? date
    : undefined;
}

export function isValidDateValue(value: string) {
  return !!parseDateValue(value);
}

export function formatApiDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
) {
  if (!value) return "—";

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value,
  );
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("id-ID", options).format(date);
}

export function getSlaDaysRemaining(value: string | null | undefined) {
  if (!value) return null;
  const dateOnly = value.slice(0, 10);
  const deadline = parseDateValue(dateOnly) ?? new Date(value);
  if (Number.isNaN(deadline.getTime())) return null;

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const deadlineStart = new Date(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate(),
  );
  return Math.round(
    (deadlineStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000),
  );
}

export function formatSlaRemaining(daysRemaining: number | null) {
  if (daysRemaining === null) return "";
  if (daysRemaining < 0) return `Terlambat ${Math.abs(daysRemaining)} hari`;
  if (daysRemaining === 0) return "Jatuh tempo hari ini";
  if (daysRemaining === 1) return "Jatuh tempo besok";
  return `Tersisa ${daysRemaining} hari`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
