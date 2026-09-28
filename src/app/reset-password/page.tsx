import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Atur ulang kata sandi | COLABORA",
  description: "Buat kata sandi baru untuk akun COLABORA.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <section
        aria-labelledby="reset-password-title"
        className="bg-card w-full max-w-md rounded-lg border p-6 sm:p-8"
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
        <h1
          id="reset-password-title"
          className="font-display mt-7 text-2xl font-semibold tracking-tight"
        >
          Atur ulang kata sandi
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Masukkan kata sandi baru untuk akun COLABORA Anda.
        </p>
        <ResetPasswordForm token={token} />
      </section>
    </main>
  );
}
