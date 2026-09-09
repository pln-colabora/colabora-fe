import { CircleCheck, Clock3, TriangleAlert } from "lucide-react";

import type { getApplicationStatus } from "@/lib/workflow";

export function StatusBadge({
  status,
}: {
  status: ReturnType<typeof getApplicationStatus>;
}) {
  const isCritical = status === "Ditolak" || status === "Terlambat";
  const isComplete = status === "Selesai";
  const style = isCritical
    ? "border-destructive-border bg-destructive-surface text-destructive"
    : isComplete
      ? "border-success-border bg-success-surface text-success"
      : "border-warning-border bg-warning-surface text-warning";
  const Icon = isCritical ? TriangleAlert : isComplete ? CircleCheck : Clock3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-semibold whitespace-nowrap ${style}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}
