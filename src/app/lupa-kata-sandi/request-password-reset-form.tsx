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
import { sendPasswordReset } from "@/lib/auth";
import { presentApiError } from "@/lib/error-utils";

const requestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi.")
    .email("Format email tidak valid."),
});

type RequestValues = z.infer<typeof requestSchema>;

export function RequestPasswordResetForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });
  const busy = form.formState.isSubmitting;

  async function handleSubmit(values: RequestValues) {
    setSent(false);
    form.clearErrors("root");
    try {
      await sendPasswordReset(values.email);
      setSent(true);
    } catch (error) {
      form.setError("root", {
        message: presentApiError(
          error,
          "Permintaan reset kata sandi gagal. Silakan coba lagi.",
        ).message,
      });
    }
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="nama@perusahaan.co.id"
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
        {sent ? (
          <p
            role="status"
            className="bg-success-surface text-success rounded-md px-3 py-2 text-sm leading-6"
          >
            Jika email tersebut terdaftar, tautan reset sudah dikirim. Periksa
            kotak masuk email Anda.
          </p>
        ) : null}

        <Button type="submit" className="min-h-11 w-full" disabled={busy}>
          {busy ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          {busy ? "Mengirim tautan..." : "Kirim tautan reset"}
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
