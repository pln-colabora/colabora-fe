import type { getApplicationStatus } from "@/lib/workflow";

export function StatusBadge({
  status,
}: {
  status: ReturnType<typeof getApplicationStatus>;
}) {
  const style =
    status === "Ditolak" || status === "Terlambat"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : status === "Selesai"
        ? "border-success/30 bg-success/10 text-success"
        : "border-warning/30 bg-warning/10 text-warning";
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-sm font-medium whitespace-nowrap ${style}`}
    >
      {status}
    </span>
  );
}
