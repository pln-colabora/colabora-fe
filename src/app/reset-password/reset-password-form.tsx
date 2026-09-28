"use client";

import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/auth";
import { presentApiError } from "@/lib/error-utils";

const resetSchema = z
  .object({
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const [complete, setComplete] = useState(false);
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const busy = form.formState.isSubmitting;

  async function handleSubmit(values: ResetValues) {
    form.clearErrors("root");
    try {
      await resetPassword(token, values.password);
      setComplete(true);
      form.reset();
    } catch (error) {
      form.setError("root", {
        message: presentApiError(
          error,
          "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.",
        ).message,
      });
    }
  }

  if (!token) {
    return (
      <div className="mt-6 space-y-4">
        <p role="alert" className="text-destructive text-sm leading-6">
          Tautan reset tidak memuat token yang diperlukan.
        </p>
        <Button asChild className="min-h-11 w-full">
          <Link href="/lupa-kata-sandi">Minta tautan baru</Link>
        </Button>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="mt-6 space-y-4">
        <p
          role="status"
          className="bg-success-surface text-success rounded-md px-3 py-2 text-sm leading-6"
        >
          Kata sandi berhasil diubah. Masuk kembali dengan kata sandi baru.
        </p>
        <Button asChild className="min-h-11 w-full">
          <Link href="/login">Masuk ke COLABORA</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        className="mt-6 space-y-5"
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kata sandi baru</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  className="h-11"
                  disabled={busy}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konfirmasi kata sandi</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ulangi kata sandi"
                  className="h-11"
                  disabled={busy}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root?.message ? (
          <p role="alert" className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <Button type="submit" className="min-h-11 w-full" disabled={busy}>
          {busy ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          {busy ? "Menyimpan kata sandi..." : "Simpan kata sandi baru"}
        </Button>
        <p className="text-center text-sm">
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Kembali ke masuk
          </Link>
        </p>
      </form>
    </Form>
  );
}
