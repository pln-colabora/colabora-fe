import Image from "next/image";

import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk | COLABORA",
  description: "Masuk ke ruang kerja COLABORA",
};

export default function LoginPage() {
  return (
    <main className="bg-card grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,1fr)]">
      <section
        aria-labelledby="login-context-title"
        className="bg-brand-surface border-t-brand-yellow hidden min-w-0 flex-col border-t-4 border-r px-8 py-8 lg:flex xl:px-12"
      >
        <header>
          <p className="font-display text-brand-ink text-xl font-semibold tracking-tight">
            COLABORA
          </p>
          <p className="text-brand-ink mt-1 text-sm">Layanan Kolaborasi PLN</p>
        </header>
        <div className="my-auto py-10">
          <div className="mx-auto max-w-lg">
            <h2
              id="login-context-title"
              className="font-display text-brand-ink max-w-sm text-3xl leading-tight font-semibold"
            >
              Koordinasi pekerjaan,
              <br />
              dari permohonan hingga penyalaan.
            </h2>
            <p className="text-brand-ink/85 mt-4 max-w-md text-base leading-7">
              Pantau tahapan proses dan lanjutkan pekerjaan sesuai peran Anda.
            </p>
          </div>
          <Image
            src="/illustrations/coordination-grid.webp"
            alt="Ilustrasi dua petugas berkoordinasi di area jaringan distribusi listrik."
            width={1448}
            height={1086}
            sizes="(min-width: 1024px) 50vw, 1px"
            className="mx-auto mt-6 h-auto w-full max-w-2xl"
          />
        </div>
        <p className="text-brand-ink/85 text-sm">
          Permohonan PB/PD · Koordinasi antar-PIC
        </p>
      </section>
      <section
        aria-labelledby="login-title"
        className="flex min-w-0 items-center justify-center px-6 py-8 sm:px-10 lg:py-12"
      >
        <div className="w-full max-w-md">
          <header className="border-t-brand-yellow mb-8 border-t-4 border-b pt-5 pb-6 lg:hidden">
            <p className="font-display text-primary text-lg font-semibold tracking-tight">
              COLABORA
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Layanan Kolaborasi PLN
            </p>
          </header>
          <h1
            id="login-title"
            className="font-display text-2xl font-semibold sm:text-3xl"
          >
            Masuk ke demo
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Pilih peran untuk mencoba alur permohonan PB/PD. Data dan perubahan
            hanya tersimpan di browser ini.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
