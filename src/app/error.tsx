"use client";

import Link from "next/link";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-12">
      <section className="bg-card w-full max-w-lg rounded-lg border p-6 text-center sm:p-8">
        <AlertTriangle className="text-destructive mx-auto size-8" aria-hidden="true" />
        <h1 className="font-display mt-4 text-2xl font-semibold">
          Terjadi kesalahan
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Kami tidak dapat memuat halaman ini saat ini. Silakan coba kembali.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button type="button" className="min-h-11" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Coba lagi
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/dashboard">Kembali ke beranda</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
