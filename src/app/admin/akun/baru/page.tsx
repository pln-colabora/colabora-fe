"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell, canManageAccounts } from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { FormPageSkeleton } from "@/components/dashboard/page-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/use-session";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { createUser } from "@/lib/auth";
import { presentApiError } from "@/lib/error-utils";
import { roles, type RoleId } from "@/lib/workflow";

const roleOptions = roles;
const roleValues = roleOptions.map((role) => role.id) as [RoleId, ...RoleId[]];

const accountSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(100, "Nama maksimal 100 karakter."),
    email: z.string().trim().email("Masukkan alamat email yang valid."),
    telp_number: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" || (/^[0-9+()\-\s]+$/.test(value) && value.length >= 8),
        "Nomor telepon minimal 8 karakter dan hanya boleh berisi angka atau tanda telepon.",
      )
      .max(20, "Nomor telepon maksimal 20 karakter."),
    role: z.enum(roleValues),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi belum sama.",
  });

type AccountFormValues = z.infer<typeof accountSchema>;

export default function CreateAccountPage() {
  const { user, error } = useSession();
  const roleId = user?.role ?? "user";
  const [dirty, setDirty] = useState(false);
  const { confirmDiscard, dialog: unsavedDialog } = useUnsavedChanges(dirty);
  const ready = !!user;

  if (!ready) {
    return (
      <AppShell active="accounts" roleId={roleId} user={user}>
        {error ? (
          <ErrorNotice error={error} onRetry={() => window.location.reload()} />
        ) : (
          <FormPageSkeleton />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell active="accounts" roleId={roleId} user={user}>
      {unsavedDialog}
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <Link
          href="/dashboard"
          onClick={(event) => {
            if (!dirty) return;
            event.preventDefault();
            void confirmDiscard().then((confirmed) => {
              if (confirmed) window.location.assign("/dashboard");
            });
          }}
          className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke beranda
        </Link>

        <header className="mt-5 border-b pb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Buat akun pengguna
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Tambahkan akun baru dan tentukan peran sesuai kebutuhan operasional.
          </p>
        </header>

        {canManageAccounts(roleId) ? (
          <AccountForm onDirtyChange={setDirty} />
        ) : (
          <Unauthorized />
        )}
      </div>
    </AppShell>
  );
}

function Unauthorized() {
  return (
    <section
      className="bg-card mt-6 rounded-lg px-5 py-4"
      aria-labelledby="account-access-title"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck
          className="text-muted-foreground mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <h2 id="account-access-title" className="font-display font-semibold">
            Halaman ini hanya untuk Admin dan Super User
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Hubungi administrator untuk membuat atau mengelola akun pengguna.
          </p>
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link href="/dashboard">Kembali ke beranda</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function AccountForm({
  onDirtyChange,
}: {
  onDirtyChange: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const [requestError, setRequestError] = useState<unknown>(null);
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      email: "",
      telp_number: "",
      role: "user",
      password: "",
      confirmPassword: "",
    },
  });
  const busy = form.formState.isSubmitting;
  const { confirmDiscard, dialog: formUnsavedDialog } = useUnsavedChanges(
    form.formState.isDirty,
  );

  useEffect(() => {
    onDirtyChange(form.formState.isDirty);
    return () => onDirtyChange(false);
  }, [form.formState.isDirty, onDirtyChange]);

  const roleDescription = roleOptions.find(
    (role) => role.id === form.watch("role"),
  );

  async function handleSubmit(values: AccountFormValues) {
    setRequestError(null);
    try {
      await createUser({
        name: values.name,
        email: values.email,
        telp_number: values.telp_number,
        password: values.password,
        role: values.role,
      });
      toast.success("Akun berhasil dibuat.");
      form.reset();
      router.push("/dashboard");
    } catch (error) {
      setRequestError(error);
      toast.error(presentApiError(error, "Akun tidak dapat dibuat.").message);
    }
  }

  return (
    <>
      {formUnsavedDialog}
      <Card className="mt-6 rounded-lg">
        <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
          <CardTitle className="text-lg">Informasi akun</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
          {requestError ? (
            <div className="mb-5">
              <ErrorNotice
                error={requestError}
                onRetry={() => setRequestError(null)}
              />
            </div>
          ) : null}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
              <fieldset
                disabled={busy}
                className="grid min-w-0 gap-5 md:grid-cols-2"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nama lengkap</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-11"
                          placeholder="Nama pengguna"
                          autoComplete="name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="h-11"
                          placeholder="nama@contoh.com"
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telp_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. HP / telepon (opsional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          className="h-11"
                          placeholder="08xxxxxxxxxx"
                          autoComplete="tel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Peran</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={busy}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background h-11 w-full">
                            <SelectValue placeholder="Pilih peran" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.label} · {role.lane}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {roleDescription?.label} akan memiliki akses sesuai
                        peran yang dipilih.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kata sandi sementara</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="h-11"
                          placeholder="Minimal 8 karakter"
                          autoComplete="new-password"
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
                          {...field}
                          type="password"
                          className="h-11"
                          placeholder="Ulangi kata sandi"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() =>
                      void confirmDiscard().then(
                        (confirmed) => confirmed && router.push("/dashboard"),
                      )
                    }
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="min-h-11" disabled={busy}>
                    {busy ? (
                      <LoaderCircle
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                    {busy ? "Membuat akun..." : "Buat akun"}
                  </Button>
                </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
