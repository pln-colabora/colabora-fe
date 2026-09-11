"use client";

import Image from "next/image";
import Link from "next/link";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="bg-background flex min-h-dvh items-center px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <section className="max-w-xl" aria-labelledby="global-error-title">
            <AlertTriangle
              className="text-destructive size-7"
              aria-hidden="true"
            />
            <p className="text-destructive mt-5 font-mono text-4xl font-semibold tracking-wide">
              500
            </p>
            <h1
              id="global-error-title"
              className="font-display mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
            >
              Terjadi gangguan sementara
            </h1>
            <p className="text-muted-foreground mt-4 max-w-lg text-base leading-7">
              Halaman ini belum dapat dimuat. Coba lagi atau kembali ke beranda
              untuk melanjutkan pekerjaan.
            </p>
            <div className="border-border mt-6 border-l-2 pl-4">
              <p className="text-sm font-semibold">Yang bisa dilakukan</p>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                <li>Muat ulang halaman beberapa saat lagi.</li>
                <li>Kembali ke beranda untuk melanjutkan pekerjaan.</li>
              </ul>
            </div>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <Button type="button" className="min-h-11" onClick={reset}>
                <RotateCcw aria-hidden="true" />
                Coba lagi
              </Button>
              <Button asChild variant="outline" className="min-h-11">
                <Link href="/dashboard">Kembali ke beranda</Link>
              </Button>
            </div>
          </section>
          <div className="relative min-h-[18rem] sm:min-h-[26rem]">
            <Image
              src="/illustrations/error-field-operations.png"
              alt="Tim teknisi menangani gangguan pada jaringan listrik"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-contain object-center"
              priority
            />
          </div>
        </div>
      </div>
    </main>
  );
}
