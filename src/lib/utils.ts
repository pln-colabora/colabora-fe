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

// Calendar-day difference between an SLA deadline (date or datetime string) and
// today. Positive = days left, 0 = today, negative = overdue.
export function slaDaysRemaining(deadline: string | null | undefined) {
  if (!deadline) return null;
  const dateOnly = deadline.slice(0, 10);
  const parsed = parseDateValue(dateOnly) ?? new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const deadlineStart = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );
  return Math.round(
    (deadlineStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000),
  );
}

// Relative SLA label, e.g. "2 hari lagi", "Besok", "Hari ini", "Terlambat 3 hari".
export function formatSlaCountdown(deadline: string | null | undefined) {
  const days = slaDaysRemaining(deadline);
  if (days === null) return null;
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
