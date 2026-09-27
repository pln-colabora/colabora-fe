import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Menunggu verifikasi | COLABORA",
  description: "Status verifikasi registrasi vendor COLABORA",
};

export default function WaitingForVerificationPage() {
  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <section
        aria-labelledby="verification-title"
        className="bg-card w-full max-w-xl rounded-lg border p-6 sm:p-8"
      >
        <Link href="/login" className="inline-flex min-h-11 items-center">
          <Image
            src="/logo/colabora.png"
            alt="Logo COLABORA"
            width={32}
            height={32}
            className="size-8 object-contain"
            priority
          />
        </Link>

        <p className="text-warning mt-8 text-sm font-medium">
          Status registrasi
        </p>
        <h1
          id="verification-title"
          className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Menunggu verifikasi
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Registrasi vendor sedang menunggu pemeriksaan Super User. Kamu dapat
          masuk setelah akun diverifikasi.
        </p>

        <div className="mt-6 border-t pt-5">
          <p className="text-sm font-medium">Apa yang terjadi selanjutnya?</p>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Super User akan meninjau informasi dan lampiran registrasi. Status
            akun akan diperbarui setelah proses verifikasi selesai.
          </p>
        </div>

        <Button asChild variant="outline" className="mt-7 min-h-11 w-full">
          <Link href="/login">Kembali ke masuk</Link>
        </Button>
      </section>
    </main>
  );
}
