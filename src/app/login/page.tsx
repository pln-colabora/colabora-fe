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
        className="bg-brand-surface relative hidden min-w-0 overflow-hidden border-r lg:block"
      >
        <Image
          src="/illustrations/coordination-grid.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 1px"
          className="object-cover object-left-bottom"
        />
        <div
          aria-hidden="true"
          className="login-illustration-scrim absolute inset-x-0 top-0 h-[54%]"
        />
        <div className="relative z-10 flex min-h-dvh flex-col px-8 py-8 xl:px-12">
          <header>
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo/colabora.png"
                alt="Logo COLABORA"
                width={32}
                height={32}
                className="size-8 shrink-0 object-contain"
                priority
              />
              <p className="font-display text-brand-ink text-xl font-semibold tracking-tight">
                COLABORA
              </p>
            </div>
          </header>
          <div className="mt-10 w-full max-w-[26rem] xl:mt-14">
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
          <p className="text-brand-ink/85 mt-auto text-sm">
            Permohonan PB/PD · Koordinasi antar-PIC
          </p>
        </div>
      </section>
      <section
        aria-labelledby="login-title"
        className="flex min-w-0 items-center justify-center px-6 py-8 sm:px-10 lg:py-12"
      >
        <div className="w-full max-w-md">
          <header className="border-t-brand-accent mb-8 border-t-4 border-b pt-5 pb-6 lg:hidden">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo/colabora.png"
                alt="Logo COLABORA"
                width={28}
                height={28}
                className="size-7 shrink-0 object-contain"
                priority
              />
              <p className="font-display text-primary text-lg font-semibold tracking-tight">
                COLABORA
              </p>
            </div>
          </header>
          <h1
            id="login-title"
            className="font-display text-2xl font-semibold sm:text-3xl"
          >
            Masuk ke COLABORA
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Masuk dengan akun Anda untuk melanjutkan permohonan PB/PD.
          </p>
          <LoginForm
            accounts={
              process.env.NODE_ENV === "development"
                ? JSON.parse(process.env.COLABORA_DEV_ACCOUNTS || "[]")
                : []
            }
          />
        </div>
      </section>
    </main>
  );
}
