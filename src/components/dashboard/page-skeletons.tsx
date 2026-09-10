import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Memuat dashboard" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-11 w-full sm:w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
      <section className="bg-card space-y-4 rounded-lg p-5" aria-hidden="true">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </section>
      <span className="sr-only">Memuat permohonan...</span>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Memuat detail permohonan" className="space-y-6">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-3 border-b pb-6">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-80 w-full" />
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
      <span className="sr-only">Memuat detail permohonan...</span>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div role="status" aria-label="Memuat formulir" className="space-y-6">
      <Skeleton className="h-4 w-64 max-w-full" />
      <div className="space-y-3 border-b pb-6">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <section className="bg-card grid gap-4 rounded-lg p-5 sm:grid-cols-2 sm:p-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className={index === 0 || index === 5 ? "sm:col-span-2" : ""}>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
        <Skeleton className="h-11 w-36 sm:col-span-2 sm:ml-auto" />
      </section>
      <span className="sr-only">Memuat formulir...</span>
    </div>
  );
}
