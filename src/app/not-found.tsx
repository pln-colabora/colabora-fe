import Image from "next/image";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-dvh items-center px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <section className="max-w-xl" aria-labelledby="not-found-title">
            <p className="text-primary font-mono text-4xl font-semibold tracking-wide">
              404
            </p>
            <h1
              id="not-found-title"
              className="font-display mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
            >
              Halaman tidak ditemukan
            </h1>
            <p className="text-muted-foreground mt-4 max-w-lg text-base leading-7">
              Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
            </p>
            <div className="border-border mt-6 border-l-2 pl-4">
              <p className="text-sm font-semibold">Kemungkinan penyebab</p>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                <li>Alamat halaman diketik tidak sesuai.</li>
                <li>Tautan yang digunakan sudah tidak aktif.</li>
              </ul>
            </div>
            <Button asChild className="mt-8 min-h-11">
              <Link href="/dashboard">
                <ArrowLeft aria-hidden="true" />
                Kembali ke beranda
              </Link>
            </Button>
          </section>

          <div className="relative min-h-[18rem] sm:min-h-[26rem]">
            <Image
              src="/illustrations/error-field-operations.png"
              alt="Tim teknisi mencari arah di dekat jaringan listrik"
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
