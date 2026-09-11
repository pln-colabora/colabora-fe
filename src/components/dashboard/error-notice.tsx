"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { presentApiError } from "@/lib/error-utils";

export function ErrorNotice({
  error,
  fallback,
  onRetry,
  retrying = false,
  backHref = "/dashboard?view=all",
}: {
  error: unknown;
  fallback?: string;
  onRetry?: () => void;
  retrying?: boolean;
  backHref?: string;
}) {
  const presentation = presentApiError(error, fallback);
  return (
    <div role="alert" aria-live="assertive" className="flex flex-wrap items-center gap-3">
      <p className="text-destructive text-sm">{presentation.message}</p>
      {presentation.action === "login" ? (
        <Button asChild variant="outline" className="min-h-10">
          <Link href="/login">Masuk kembali</Link>
        </Button>
      ) : presentation.action === "back" ? (
        <Button asChild variant="outline" className="min-h-10">
          <Link href={backHref}>Kembali ke daftar</Link>
        </Button>
      ) : presentation.action === "retry" && onRetry ? (
        <Button type="button" variant="outline" className="min-h-10" disabled={retrying} onClick={onRetry}>
          {retrying ? "Memuat..." : "Coba lagi"}
        </Button>
      ) : null}
    </div>
  );
}
