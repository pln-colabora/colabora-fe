import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="bg-background min-h-dvh px-4 py-8 sm:px-6">
      <div role="status" aria-label="Memuat halaman" className="mx-auto w-full max-w-5xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-48 w-full" />
        <span className="sr-only">Memuat halaman...</span>
      </div>
    </main>
  );
}
