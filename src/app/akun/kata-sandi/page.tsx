"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { FormPageSkeleton } from "@/components/dashboard/page-skeletons";
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
import { useSession } from "@/hooks/use-session";
import { logout } from "@/lib/auth";
import { presentApiError } from "@/lib/error-utils";
import { changeOwnPassword } from "@/lib/users";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.password !== values.currentPassword, {
    message: "Kata sandi baru harus berbeda dari kata sandi saat ini.",
    path: ["password"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const fields = [
  {
    name: "currentPassword",
    label: "Kata sandi saat ini",
    autoComplete: "current-password",
    placeholder: "Masukkan kata sandi saat ini",
  },
  {
    name: "password",
    label: "Kata sandi baru",
    autoComplete: "new-password",
    placeholder: "Minimal 8 karakter",
  },
  {
    name: "confirmPassword",
    label: "Konfirmasi kata sandi baru",
    autoComplete: "new-password",
    placeholder: "Ulangi kata sandi baru",
  },
] as const;

export default function ChangePasswordPage() {
  const { user, error } = useSession();
  const router = useRouter();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });
  const busy = form.formState.isSubmitting;

  async function handleSubmit(values: ChangePasswordValues) {
    form.clearErrors("root");
    try {
      await changeOwnPassword(values.currentPassword, values.password);
    } catch (requestError) {
      form.setError("root", {
        message: presentApiError(requestError, "Kata sandi tidak dapat diubah.")
          .message,
      });
      return;
    }
    // The API revokes every refresh token, so the current session cannot be
    // renewed; sign in again now instead of failing at the next refresh.
    void logout();
    toast.success(
      "Kata sandi berhasil diubah. Masuk kembali dengan kata sandi baru.",
    );
    router.replace("/login");
  }

  return (
    <AppShell active="password" roleId={user?.role ?? "user"} user={user}>
      {!user ? (
        error ? (
          <ErrorNotice error={error} onRetry={() => window.location.reload()} />
        ) : (
          <FormPageSkeleton />
        )
      ) : (
        <div className="mx-auto w-full max-w-xl min-w-0">
          <header className="border-b pb-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Ubah kata sandi
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Setelah kata sandi diubah, Anda akan keluar dari semua sesi dan
              perlu masuk kembali.
            </p>
          </header>

          <Form {...form}>
            <form
              className="mt-6 space-y-5"
              onSubmit={form.handleSubmit(handleSubmit)}
              noValidate
            >
              {fields.map(({ name, label, autoComplete, placeholder }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete={autoComplete}
                          placeholder={placeholder}
                          className="h-11"
                          disabled={busy}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {form.formState.errors.root?.message ? (
                <p role="alert" className="text-destructive text-sm">
                  {form.formState.errors.root.message}
                </p>
              ) : null}

              <Button
                type="submit"
                className="min-h-11 w-full sm:w-auto"
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : null}
                {busy ? "Menyimpan..." : "Simpan kata sandi baru"}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </AppShell>
  );
}
