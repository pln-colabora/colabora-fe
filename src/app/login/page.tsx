import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk | COLABORA",
  description: "Masuk ke ruang kerja COLABORA",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(28rem,38rem)]">
      <section className="bg-muted/35 hidden border-r lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">
            COLABORA
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Ruang kerja operasional
          </p>
        </div>

        <div className="max-w-lg pb-16">
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight xl:text-5xl">
            Ruang kerja operasional COLABORA.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-base leading-7">
            Masuk untuk melanjutkan pekerjaan Anda.
          </p>
        </div>

        <p className="text-muted-foreground text-xs">
          Akses hanya untuk pengguna terdaftar.
        </p>
      </section>

      <section className="flex min-h-dvh items-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-12 lg:hidden">
            <p className="font-display text-lg font-semibold tracking-tight">
              COLABORA
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Ruang kerja operasional
            </p>
          </div>

          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Masuk ke akun Anda
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Gunakan email dan kata sandi yang telah terdaftar.
            </p>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
