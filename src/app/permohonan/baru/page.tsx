"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  AppShell,
  canCreatePermohonan,
} from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { FormPageSkeleton } from "@/components/dashboard/page-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useSession } from "@/hooks/use-session";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { createApplication } from "@/lib/applications";
import { presentApiError } from "@/lib/error-utils";
import { getDashboardReturnPath } from "@/lib/navigation";
import { getRole, type RoleId } from "@/lib/workflow";

const jenisByRole: Partial<Record<RoleId, string[]>> = {
  "pelayanan-pelanggan": ["JTR", "JTM / Gardu"],
  nps: ["PLG TM <5 GWNG", "PLG TM >5 GWNG"],
};

const requestTypes = ["Pasang baru", "Perubahan daya"] as const;
const units = ["ULP Taman", "ULP Menganti", "ULP Karang Pilang"] as const;

const baseSchema = z.object({
  customer: z
    .string()
    .trim()
    .min(2, "Nama pelanggan minimal 2 karakter.")
    .max(150, "Nama pelanggan maksimal 150 karakter."),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor telepon minimal 8 karakter.")
    .max(20, "Nomor telepon maksimal 20 karakter.")
    .regex(
      /^[0-9+()\-\s]+$/,
      "Nomor telepon hanya boleh berisi angka dan tanda telepon umum.",
    ),
  requestType: z.enum(requestTypes),
  connectionType: z.string().min(1, "Jenis sambungan wajib dipilih."),
  unit: z.enum(units),
  location: z
    .string()
    .trim()
    .min(2, "Lokasi minimal 2 karakter.")
    .max(255, "Lokasi maksimal 255 karakter."),
});

type FormValues = z.infer<typeof baseSchema>;

export default function ApplicationCreatePage() {
  const { user, error } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = user?.role ?? "user";
  const returnTo = getDashboardReturnPath(searchParams.get("returnTo"));
  const [createDirty, setCreateDirty] = useState(false);
  const { confirmDiscard, dialog: unsavedDialog } = useUnsavedChanges(createDirty);
  const ready = !!user;

  if (!ready) {
    return (
      <AppShell active="create" roleId={roleId} user={user}>
        {error ? (
          <ErrorNotice error={error} onRetry={() => window.location.reload()} />
        ) : (
          <FormPageSkeleton />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell active="create" roleId={roleId} user={user}>
      {unsavedDialog}
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <Link
          href={returnTo}
          onClick={(event) => {
            if (!createDirty) return;
            event.preventDefault();
            void confirmDiscard().then((confirmed) => {
              if (confirmed) router.push(returnTo);
            });
          }}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke daftar permohonan
        </Link>

        <header className="mt-5 border-b pb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Permohonan PB/PD baru
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Catat data pelanggan dan kebutuhan sambungan untuk memulai proses
            permohonan. Jenis sambungan mengikuti kewenangan peran Anda.
          </p>
        </header>

        {canCreatePermohonan(roleId) ? (
          <CreateForm
            roleId={roleId}
            returnTo={returnTo}
            onDirtyChange={setCreateDirty}
          />
        ) : (
          <Unauthorized roleId={roleId} />
        )}
      </div>
    </AppShell>
  );
}

function Unauthorized({ roleId }: { roleId: RoleId }) {
  const role = getRole(roleId);
  return (
    <section
      className="bg-card mt-6 rounded-lg px-5 py-4"
      aria-labelledby="unauthorized-title"
    >
      <div className="flex items-start gap-3">
        <LockKeyhole
          className="text-muted-foreground mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <h2 id="unauthorized-title" className="font-display font-semibold">
            Peran ini tidak berwenang membuat permohonan
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {role.lane} — {role.label} tidak membuka permohonan baru. Pembuatan
            permohonan dilakukan oleh Pelayanan Pelanggan (JTR/JTM) atau NPS
            (PLG TM).
          </p>
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link href="/dashboard?view=all">Lihat daftar permohonan</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function CreateForm({
  roleId,
  returnTo,
  onDirtyChange,
}: {
  roleId: RoleId;
  returnTo: string;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const connectionOptions = useMemo(() => jenisByRole[roleId] ?? [], [roleId]);
  const schema = useMemo(
    () =>
      baseSchema.refine(
        (values) => connectionOptions.includes(values.connectionType),
        {
          path: ["connectionType"],
          message: "Jenis sambungan tidak sesuai kewenangan peran.",
        },
      ),
    [connectionOptions],
  );
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer: "",
      phone: "",
      requestType: requestTypes[0],
      connectionType: connectionOptions[0] ?? "",
      unit: units[0],
      location: "",
    },
  });
  const busy = form.formState.isSubmitting;
  const { confirmDiscard, dialog: unsavedDialog } = useUnsavedChanges(
    form.formState.isDirty,
  );
  const { confirm: confirmCreate, dialog: createDialog } = useConfirmDialog();
  const [requestError, setRequestError] = useState<unknown>(null);

  useEffect(() => {
    onDirtyChange(form.formState.isDirty);
    return () => onDirtyChange(false);
  }, [form.formState.isDirty, onDirtyChange]);

  async function handleSubmit(values: FormValues) {
    if (form.formState.isSubmitting) return;
    if (
      !(await confirmCreate({
        title: "Buat permohonan baru?",
        description: "Permohonan akan disimpan dan workflow PB/PD akan dimulai.",
        confirmLabel: "Simpan permohonan",
      }))
    )
      return;
    setRequestError(null);
    try {
      const application = await createApplication({
        pelanggan_nama: values.customer,
        pelanggan_no_hp: values.phone,
        pelanggan_alamat: values.location,
        jenis_permohonan:
          values.requestType === "Pasang baru"
            ? "Pasang Baru (PB)"
            : "Perubahan Daya (PD)",
        jenis_sambungan:
          values.connectionType === "JTM / Gardu"
            ? "JTM/Gardu"
            : values.connectionType,
        ...(values.connectionType.startsWith("PLG TM")
          ? { ulp_unit: values.unit }
          : {}),
      });
      toast.success("Permohonan berhasil dibuat.");
      router.push(
        `/permohonan/${application.id}?returnTo=${encodeURIComponent(returnTo)}`,
      );
    } catch (error) {
      const message = presentApiError(error, "Gagal menyimpan permohonan.").message;
      setRequestError(error);
      toast.error(message);
    }
  }

  return (
    <>
      {unsavedDialog}
      {createDialog}
      <Card className="mt-6 rounded-lg">
      <CardContent className="p-5 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
            <fieldset className="min-w-0" disabled={busy}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customer"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nama pelanggan</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nama pelanggan"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. HP / telepon</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis permohonan</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={busy}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background h-11 w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {requestTypes.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="connectionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis sambungan</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={busy}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background h-11 w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {connectionOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Pilihan dibatasi sesuai kewenangan peran{" "}
                        {getRole(roleId).label}.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {roleId === "nps" && (
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit / ULP</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={busy}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background h-11 w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Lokasi</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jl. ... No. ..., Surabaya"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {Boolean(requestError) && (
                <ErrorNotice
                  error={requestError}
                  onRetry={() => void form.handleSubmit(handleSubmit)()}
                  retrying={busy}
                />
              )}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  asChild
                  variant="outline"
                  className="min-h-11"
                  onClick={(event) => {
                    if (!form.formState.isDirty) return;
                    event.preventDefault();
                    void confirmDiscard().then((confirmed) => {
                      if (confirmed) router.push(returnTo);
                    });
                  }}
                >
                  <Link href={returnTo}>Batal</Link>
                </Button>
                <Button type="submit" className="min-h-11">
                  {busy && <LoaderCircle className="animate-spin" aria-hidden="true" />}
                  {busy ? "Menyimpan..." : "Simpan permohonan"}
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
