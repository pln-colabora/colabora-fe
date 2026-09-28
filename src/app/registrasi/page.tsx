"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EvidenceUploader } from "@/components/dashboard/evidence-uploader";
import { Button } from "@/components/ui/button";
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
import { registerAccount } from "@/lib/auth";
import { presentApiError } from "@/lib/error-utils";
import { roles, type RoleId } from "@/lib/workflow";

const registrationRoleIds = roles
  .filter(({ id }) => id !== "admin" && id !== "super-user")
  .map(({ id }) => id) as [RoleId, ...RoleId[]];

const registrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(100, "Nama maksimal 100 karakter."),
    email: z
      .string()
      .trim()
      .min(1, "Email wajib diisi.")
      .email("Format email tidak valid."),
    role: z.enum(registrationRoleIds, {
      error: "Pilih peran yang diajukan.",
    }),
    telp_number: z
      .string()
      .trim()
      .max(20, "Nomor telepon maksimal 20 karakter.")
      .refine((value) => !value || value.length >= 8, {
        message: "Nomor telepon minimal 8 karakter.",
      }),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
    document: z
      .file({ error: "Dokumen verifikasi wajib dilampirkan." })
      .refine(
        (file) =>
          ["application/pdf", "image/jpeg", "image/png"].includes(
            file.type,
          ) || /\.(pdf|jpe?g|png)$/i.test(file.name),
        { message: "Dokumen harus berupa PDF, JPG, JPEG, atau PNG." },
      ),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

type RegistrationValues = z.infer<typeof registrationSchema>;

export default function RegistrationPage() {
  const router = useRouter();
  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      telp_number: "",
      password: "",
      confirmPassword: "",
    },
  });
  const busy = form.formState.isSubmitting;

  async function handleSubmit(values: RegistrationValues) {
    try {
      await registerAccount({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        telp_number: values.telp_number || undefined,
        document: values.document,
      });
      toast.success("Registrasi terkirim untuk ditinjau.");
      router.replace("/menunggu-verifikasi");
    } catch (error) {
      const message = presentApiError(
        error,
        "Registrasi gagal. Silakan coba lagi.",
      ).message;
      form.setError("root", { message });
      toast.error(message);
    }
  }

  return (
    <main className="bg-background min-h-dvh px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b pb-5">
          <Link href="/login" className="flex min-h-11 items-center gap-2">
            <Image
              src="/logo/colabora.png"
              alt=""
              width={32}
              height={32}
              className="size-8 object-contain"
              priority
            />
            <span className="font-display text-primary text-lg font-semibold tracking-tight">
              COLABORA
            </span>
          </Link>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Masuk
          </Link>
        </header>

        <section aria-labelledby="registration-title" className="mt-8">
          <h1
            id="registration-title"
            className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Registrasi akun
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Isi informasi akun, ajukan peran, dan lampirkan satu dokumen
            verifikasi. Admin atau Super User akan meninjau pengajuan sebelum
            akun dapat digunakan.
          </p>

          <Form {...form}>
            <form
              className="bg-card mt-6 space-y-5 rounded-lg border p-5 sm:p-6"
              onSubmit={form.handleSubmit(handleSubmit)}
              noValidate
            >
              <fieldset
                disabled={busy}
                className="grid min-w-0 gap-5 md:grid-cols-2"
              >
                <legend className="font-display mb-5 text-lg font-semibold">
                  Informasi akun
                </legend>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nama lengkap</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="name"
                          className="h-11"
                          placeholder="Nama pemohon"
                          {...field}
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
                          type="email"
                          autoComplete="email"
                          className="h-11"
                          placeholder="nama@perusahaan.co.id"
                          {...field}
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
                          type="tel"
                          autoComplete="tel"
                          className="h-11"
                          placeholder="08xxxxxxxxxx"
                          {...field}
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
                      <FormLabel>Peran yang diajukan</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={busy}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Pilih peran" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles
                            .filter(
                              ({ id }) => id !== "admin" && id !== "super-user",
                            )
                            .map(({ id, label }) => (
                              <SelectItem key={id} value={id}>
                                {label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Peran dapat disesuaikan oleh Admin atau Super User saat
                        meninjau akun.
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
                      <FormLabel>Kata sandi</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          className="h-11"
                          placeholder="Minimal 8 karakter"
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
                          className="h-11"
                          placeholder="Ulangi kata sandi"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="document"
                  render={({ field, fieldState }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel id="registration-document-label">
                        Dokumen verifikasi
                      </FormLabel>
                      <FormControl>
                        <EvidenceUploader
                          files={field.value ? [field.value] : []}
                          selectionMode="single"
                          fileLabel="dokumen verifikasi"
                          helpText="Pilih satu file PDF, JPG, JPEG, atau PNG."
                          aria-labelledby="registration-document-label"
                          aria-invalid={fieldState.invalid}
                          disabled={busy}
                          onFilesChange={(files) => {
                            field.onChange(files[0]);
                            void form.trigger("document");
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        File akan dikirim bersama data registrasi untuk
                        pemeriksaan akun.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>

              {form.formState.errors.root?.message ? (
                <p role="alert" className="text-destructive text-sm">
                  {form.formState.errors.root.message}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                <Button asChild variant="outline" className="min-h-11">
                  <Link href="/login">Kembali ke masuk</Link>
                </Button>
                <Button type="submit" className="min-h-11" disabled={busy}>
                  {busy ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : null}
                  {busy ? "Mengirim registrasi..." : "Kirim registrasi"}
                </Button>
              </div>
            </form>
          </Form>
        </section>
      </div>
    </main>
  );
}
