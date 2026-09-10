import Link from "next/link";

import { ArrowLeft, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-12">
      <section className="bg-card w-full max-w-lg rounded-lg border p-6 text-center sm:p-8">
        <SearchX className="text-muted-foreground mx-auto size-8" aria-hidden="true" />
        <h1 className="font-display mt-4 text-2xl font-semibold">
          Halaman tidak ditemukan
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Halaman yang Anda cari mungkin sudah dipindahkan atau alamatnya tidak tersedia.
        </p>
        <Button asChild className="mt-6 min-h-11">
          <Link href="/dashboard">
            <ArrowLeft aria-hidden="true" />
            Kembali ke beranda
          </Link>
        </Button>
      </section>
    </main>
  );
}
