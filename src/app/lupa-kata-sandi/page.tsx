import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import { RequestPasswordResetForm } from "./request-password-reset-form";

export const metadata: Metadata = {
  title: "Lupa kata sandi | COLABORA",
  description: "Minta tautan untuk mengatur ulang kata sandi COLABORA.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <section
        aria-labelledby="forgot-password-title"
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
          id="forgot-password-title"
          className="font-display mt-7 text-2xl font-semibold tracking-tight"
        >
          Lupa kata sandi?
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Masukkan email akun. Jika terdaftar, kami akan mengirim tautan untuk
          membuat kata sandi baru.
        </p>
        <RequestPasswordResetForm />
      </section>
    </main>
  );
}
