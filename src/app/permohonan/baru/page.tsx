"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
import { EvidenceUploader } from "@/components/dashboard/evidence-uploader";
import { FormPageSkeleton } from "@/components/dashboard/page-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
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
import {
  createApplication,
  getTariffOptions,
  saveAndContinueDraft,
  saveDraft,
  type DraftApplicationRequest,
  type TariffPowerOption,
} from "@/lib/applications";
import { presentApiError } from "@/lib/error-utils";
import { getDashboardReturnPath } from "@/lib/navigation";
import {
  getRole,
  exactTariffPowers,
  normalizeGolongan,
  tarifForGolongan,
  tarifLabels,
  type Application,
  type RoleId,
} from "@/lib/workflow";

const jenisByRole: Partial<Record<RoleId, string[]>> = {
  "pelayanan-pelanggan": ["JTR", "JTM / Gardu"],
  nps: ["PLG TM <5 GWNG", "PLG TM >5 GWNG"],
};

const requestTypes = ["Pasang baru", "Perubahan daya"] as const;
const units = ["ULP Taman", "ULP Menganti", "ULP Karang Pilang"] as const;

// Tarif options follow the order of the shared label map.
const tarifOrder = Object.keys(tarifLabels);

// Form uses display names; the tarif endpoint and create payload use the API name.
const toApiJenis = (connectionType: string) =>
  connectionType === "JTM / Gardu" ? "JTM/Gardu" : connectionType;

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const acceptedFile = /\.(pdf|jpe?g|png|xlsx?)$/i;

function tariffDisplayLabel(value: string) {
  return tarifLabels[value] ?? value;
}

function exactPowerLabel(option: TariffPowerOption) {
  const daya =
    option.daya_label ??
    `${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(option.daya_min)} VA`;
  return option.pembatas ? `${daya} · ${option.pembatas}` : daya;
}

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
  unit: z.string().min(1, "Unit / ULP wajib dipilih."),
  location: z
    .string()
    .trim()
    .min(2, "Lokasi minimal 2 karakter.")
    .max(255, "Lokasi maksimal 255 karakter."),
  jenisPembayaran: z.enum(["pascabayar", "prabayar"], { error: "Jenis pembayaran wajib dipilih." }),
  tarif: z.string().min(1, "Tarif wajib dipilih."),
  golonganTarif: z.string().min(1, "Golongan tarif wajib dipilih."),
  golonganTarifLama: z.string(),
  dayaBaru: z.string().min(1, "Daya wajib dipilih."),
  dayaLama: z.string(),
  paymentDate: z.iso.date("Tanggal pembayaran tidak valid."),
  paymentAmount: z
    .string()
    .regex(
      /^[1-9]\d*$/,
      "Nominal pembayaran harus berupa rupiah bulat lebih dari nol.",
    )
    .refine(
      (value) => Number.isSafeInteger(Number(value)),
      "Nominal pembayaran terlalu besar.",
    ),
  files: z
    .array(
      z
        .custom<File>(
          (value) => typeof File !== "undefined" && value instanceof File,
          "Berkas evidence tidak valid.",
        )
        .refine(
          (file) => file.size <= MAX_FILE_SIZE,
          "Ukuran setiap evidence maksimal 30 MB.",
        )
        .refine(
          (file) => acceptedFile.test(file.name),
          "Evidence harus berupa PDF, JPG, JPEG, PNG, XLS, atau XLSX.",
        ),
    )
    .min(1, "Unggah minimal satu evidence."),
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

export function CreateForm({
  roleId,
  returnTo,
  onDirtyChange,
  draft,
}: {
  roleId: RoleId;
  returnTo: string;
  onDirtyChange: (dirty: boolean) => void;
  draft?: Application;
}) {
  const connectionOptions = useMemo(() => jenisByRole[roleId] ?? [], [roleId]);
  const schema = useMemo(
    () =>
      baseSchema
        .refine(
          (values) => connectionOptions.includes(values.connectionType),
          {
            path: ["connectionType"],
            message: "Jenis sambungan tidak sesuai kewenangan peran.",
          },
        )
        .refine(
          (values) =>
            values.requestType !== "Perubahan daya" ||
            (values.dayaLama !== "" && values.golonganTarifLama !== ""),
          {
            path: ["dayaLama"],
            message: "Daya lama wajib dipilih.",
          },
        )
        .refine(
          (values) =>
            values.requestType !== "Perubahan daya" ||
            !values.dayaBaru ||
            values.dayaBaru !== values.dayaLama,
          {
            path: ["dayaBaru"],
            message: "Daya baru harus berbeda dari daya lama.",
          },
        ),
    [connectionOptions],
  );
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer: draft?.customer ?? "",
      phone: draft?.phone ?? "",
      requestType: draft?.requestType ?? requestTypes[0],
      connectionType: draft?.connectionType ?? connectionOptions[0] ?? "",
      unit: draft?.unit ?? units[0],
      location: draft?.location ?? "",
      jenisPembayaran: draft?.jenisPembayaran,
      // EIS imports carry only the golongan (column TARIF); derive tarif from it
      // so the golongan and daya dropdowns can match the imported values.
      tarif:
        draft?.tarif ??
        tarifForGolongan(normalizeGolongan(draft?.golonganTarif)),
      golonganTarif: normalizeGolongan(draft?.golonganTarif),
      golonganTarifLama: normalizeGolongan(draft?.golonganTarifLama),
      dayaBaru: draft?.dayaBaru ? String(draft.dayaBaru) : "",
      dayaLama: draft?.dayaLama ? String(draft.dayaLama) : "",
      paymentDate: draft?.paymentDate ?? "",
      paymentAmount: draft?.paymentAmount ? String(draft.paymentAmount) : "",
      files: [],
    },
  });
  const busy = form.formState.isSubmitting;
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const formBusy = busy || savingDraft;
  const { confirmDiscard, dialog: unsavedDialog } = useUnsavedChanges(
    form.formState.isDirty,
  );
  const { confirm: confirmCreate, dialog: createDialog } = useConfirmDialog();
  const [requestError, setRequestError] = useState<unknown>(null);

  useEffect(() => {
    onDirtyChange(form.formState.isDirty);
    return () => onDirtyChange(false);
  }, [form.formState.isDirty, onDirtyChange]);

  const [tariffs, setTariffs] = useState<TariffPowerOption[]>([]);
  const [tariffLoading, setTariffLoading] = useState(false);
  const [tariffError, setTariffError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    setTariffLoading(true);
    setTariffError(null);
    getTariffOptions()
      .then((data) => {
        if (!cancelled) setTariffs(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) setTariffError(error);
      })
      .finally(() => {
        if (!cancelled) setTariffLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const requestType = form.watch("requestType");
  const connectionType = form.watch("connectionType");
  const tarif = form.watch("tarif");
  const golonganTarif = form.watch("golonganTarif");
  const golonganTarifLama = form.watch("golonganTarifLama");
  const apiJenis = toApiJenis(connectionType);

  // An EIS import fixes tarif, golongan and daya from the file, so for drafts
  // they are matched against the whole catalogue regardless of jenis sambungan.
  // Manual entry keeps the jenis -> tarif -> golongan -> daya order.
  const isDraft = Boolean(draft);
  const inTariffScope = useCallback(
    (option: { jenis_sambungan: string }) =>
      isDraft || option.jenis_sambungan === apiJenis,
    [isDraft, apiJenis],
  );
  const usesApiTariffs = tariffs.some(
    (option) => option.daya_label && option.golongan_tarif,
  );
  const detailedTariffs = useMemo(() => {
    if (usesApiTariffs) return tariffs;
    return exactTariffPowers.map((option) => ({
      ...option,
      jenis_sambungan: apiJenis,
      label: option.daya_label,
      daya_max: option.daya_min,
    }));
  }, [tariffs, usesApiTariffs, apiJenis]);

  const tarifChoices = useMemo(() => {
    const present = new Set(
      detailedTariffs
        .filter(inTariffScope)
        .map((o) => o.tarif),
    );
    const choices = tarifOrder.filter((value) => present.has(value));
    if (draft?.tarif && !choices.includes(draft.tarif)) choices.push(draft.tarif);
    return choices;
  }, [detailedTariffs, inTariffScope, draft?.tarif]);

  const tariffPowerChoices = useMemo(() => {
    const seen = new Set<string>();
    return detailedTariffs
      .filter(
        (o) =>
          o.tarif === tarif &&
          inTariffScope(o),
      )
      .filter((o) => {
        const key = `${o.daya_min}:${o.pembatas ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(
        (a, b) => (a.daya_min ?? Infinity) - (b.daya_min ?? Infinity),
      );
  }, [detailedTariffs, tarif, inTariffScope]);
  const dayaChoices = tariffPowerChoices.filter(
    (option) => option.golongan_tarif === golonganTarif,
  );

  const availableGolonganChoices = useMemo(
    () =>
      [
        ...new Set(
          detailedTariffs
            .filter(
              (option) =>
                option.tarif === tarif &&
                inTariffScope(option) &&
                option.golongan_tarif,
            )
            .map((option) => option.golongan_tarif),
        ),
      ].sort(),
    [detailedTariffs, tarif, inTariffScope],
  );
  const golonganChoices = [...availableGolonganChoices];
  if (draft?.golonganTarif && !golonganChoices.includes(draft.golonganTarif))
    golonganChoices.push(draft.golonganTarif);
  const golonganLamaChoices = [...golonganChoices];
  if (
    draft?.golonganTarifLama &&
    !golonganLamaChoices.includes(draft.golonganTarifLama)
  )
    golonganLamaChoices.push(draft.golonganTarifLama);
  const dayaLamaChoices = useMemo(
    () =>
      tariffPowerChoices.filter(
        (option) => option.golongan_tarif === golonganTarifLama,
      ),
    [tariffPowerChoices, golonganTarifLama],
  );
  const selectedDayaBaru = dayaChoices.find(
    (option) => String(option.daya_min) === form.getValues("dayaBaru"),
  );
  const selectedDayaLama = dayaLamaChoices.find(
    (option) => String(option.daya_min) === form.getValues("dayaLama"),
  );

  // Tarif, golongan and daya options are scoped to jenis sambungan. Changing it
  // keeps every value that still exists for the new jenis and clears only the
  // rest, so imported (EIS) values survive when jenis is filled in afterwards.
  function keepValidTariffFields(jenis: string) {
    const values = form.getValues();
    const options = detailedTariffs.filter(
      (option) =>
        option.tarif === values.tarif &&
        // The static fallback catalogue is the same for every jenis.
        (option.jenis_sambungan === jenis || !usesApiTariffs),
    );
    const powers = (golongan: string) =>
      options
        .filter((option) => option.golongan_tarif === golongan)
        .map((option) => String(option.daya_min));
    if (!options.length) form.setValue("tarif", "");
    for (const [golonganField, dayaField] of [
      ["golonganTarif", "dayaBaru"],
      ["golonganTarifLama", "dayaLama"],
    ] as const) {
      const available = powers(values[golonganField]);
      if (!available.length) form.setValue(golonganField, "");
      if (!available.includes(values[dayaField])) form.setValue(dayaField, "");
    }
  }

  function draftPayload(values: FormValues, continuing = false): DraftApplicationRequest {
    const oldPower = detailedTariffs.find(
      (option) =>
        option.tarif === values.tarif &&
        option.jenis_sambungan === toApiJenis(values.connectionType) &&
        option.golongan_tarif === values.golonganTarifLama &&
        String(option.daya_min) === values.dayaLama,
    );
    const newPower = detailedTariffs.find(
      (option) =>
        option.tarif === values.tarif &&
        option.jenis_sambungan === toApiJenis(values.connectionType) &&
        option.golongan_tarif === values.golonganTarif &&
        String(option.daya_min) === values.dayaBaru,
    );
    const oldUnchanged = values.dayaLama === String(draft?.dayaLama ?? "");
    const newUnchanged = values.dayaBaru === String(draft?.dayaBaru ?? "");
    return {
      jenis_permohonan:
        values.requestType === "Pasang baru"
          ? "Pasang Baru (PB)"
          : "Perubahan Daya (PD)",
      jenis_sambungan: toApiJenis(values.connectionType),
      jenis_pembayaran: values.jenisPembayaran ?? "",
      pelanggan_nama: values.customer,
      pelanggan_alamat: values.location,
      pelanggan_no_hp: values.phone,
      tanggal_pembayaran: values.paymentDate,
      nominal_pembayaran: values.paymentAmount ? Number(values.paymentAmount) : null,
      tarif: values.tarif || null,
      golongan_tarif: values.golonganTarif || null,
      golongan_tarif_lama:
        values.requestType === "Perubahan daya"
          ? values.golonganTarifLama || null
          : continuing
            ? null
            : draft?.golonganTarifLama ?? null,
      daya_baru: values.dayaBaru ? Number(values.dayaBaru) : null,
      daya_lama:
        values.requestType === "Perubahan daya" && values.dayaLama
          ? Number(values.dayaLama)
          : continuing
            ? null
            : draft?.dayaLama ?? null,
      pembatas_baru:
        newPower?.pembatas ??
        (newUnchanged ? draft?.pembatasBaru : null) ??
        null,
      pembatas_lama:
        values.requestType === "Perubahan daya"
          ? oldPower?.pembatas ??
            (oldUnchanged ? draft?.pembatasLama : null) ??
            null
          : continuing
            ? null
            : draft?.pembatasLama ?? null,
      ulp_unit: values.unit,
    };
  }

  async function handleSaveDraft() {
    if (!draft) return;
    setSavingDraft(true);
    setRequestError(null);
    setSavedNotice("");
    try {
      await saveDraft(draft.id, draftPayload(form.getValues()));
      form.reset(form.getValues());
      setSavedNotice("Draft berhasil disimpan.");
      toast.success("Draft berhasil disimpan.");
    } catch (error) {
      setRequestError(error);
      toast.error(presentApiError(error, "Gagal menyimpan draft.").message);
    } finally {
      setSavingDraft(false);
    }
  }

  // Names exactly which imported value does not exist in the tariff catalogue,
  // e.g. "Daya baru 23.000 VA tidak tersedia untuk golongan S1".
  function importedPowerError(
    golongan: string,
    daya: string,
    which: "baru" | "lama",
  ): { field: "golongan" | "daya"; message: string } | null {
    const golonganLabel = which === "baru" ? "Golongan tarif baru" : "Golongan tarif lama";
    const dayaLabel = which === "baru" ? "Daya baru" : "Daya lama";
    if (!golongan)
      return { field: "golongan", message: `${golonganLabel} wajib dipilih.` };
    const powers = tariffPowerChoices.filter(
      (option) => option.golongan_tarif === golongan,
    );
    if (!powers.length)
      return {
        field: "golongan",
        message: `${golonganLabel} ${golongan} tidak terdaftar untuk tarif ${tariffDisplayLabel(tarif) || "yang dipilih"}. Pilih golongan dari daftar.`,
      };
    if (!daya) return { field: "daya", message: `${dayaLabel} wajib dipilih.` };
    if (powers.some((option) => String(option.daya_min) === daya)) return null;
    const dayaText = `${new Intl.NumberFormat("id-ID").format(Number(daya))} VA`;
    return {
      field: "daya",
      message: `${dayaLabel} ${dayaText} tidak tersedia untuk golongan ${golongan}. Pilih golongan lain atau daya yang tersedia.`,
    };
  }

  const dayaBaruValue = form.watch("dayaBaru");
  const dayaLamaValue = form.watch("dayaLama");
  // Imported rows are checked as soon as the catalogue is loaded and again on
  // every change, so mismatches are visible before the user presses save.
  useEffect(() => {
    if (!draft || tariffLoading || !detailedTariffs.length) return;
    const checks = [
      ["golonganTarif", "dayaBaru", importedPowerError(golonganTarif, dayaBaruValue, "baru")],
      [
        "golonganTarifLama",
        "dayaLama",
        requestType === "Perubahan daya"
          ? importedPowerError(golonganTarifLama, dayaLamaValue, "lama")
          : null,
      ],
    ] as const;
    for (const [golonganField, dayaField, error] of checks) {
      form.clearErrors([golonganField, dayaField]);
      if (error)
        form.setError(error.field === "golongan" ? golonganField : dayaField, {
          message: error.message,
        });
    }
    // importedPowerError reads the same watched values listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, tariffLoading, detailedTariffs, tarif, requestType, golonganTarif, golonganTarifLama, dayaBaruValue, dayaLamaValue]);

  async function handleSubmit(values: FormValues) {
    if (draft) {
      const newPowerError = importedPowerError(values.golonganTarif, values.dayaBaru, "baru");
      const oldPowerError =
        values.requestType === "Perubahan daya"
          ? importedPowerError(values.golonganTarifLama, values.dayaLama, "lama")
          : null;
      if (newPowerError) form.setError(newPowerError.field === "golongan" ? "golonganTarif" : "dayaBaru", { message: newPowerError.message });
      if (oldPowerError) form.setError(oldPowerError.field === "golongan" ? "golonganTarifLama" : "dayaLama", { message: oldPowerError.message });
      if (newPowerError || oldPowerError) return;
      setRequestError(null);
      setSavedNotice("");
      try {
        const application = await saveAndContinueDraft(draft.id, draftPayload(values, true), values.files, () => {
          form.reset(values);
          setSavedNotice("Perubahan draft sudah tersimpan.");
        });
        toast.success("Draft berhasil dilanjutkan.");
        router.push(`/permohonan/${application.id}?returnTo=${encodeURIComponent(returnTo)}`);
      } catch (error) {
        setRequestError(error);
        toast.error(presentApiError(error, "Gagal melanjutkan draft.").message);
      }
      return;
    }
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
        tanggal_pembayaran: values.paymentDate,
        nominal_pembayaran: Number(values.paymentAmount),
        jenis_permohonan:
          values.requestType === "Pasang baru"
            ? "Pasang Baru (PB)"
            : "Perubahan Daya (PD)",
        jenis_sambungan: toApiJenis(values.connectionType),
        jenis_pembayaran: values.jenisPembayaran,
        tarif: values.tarif,
        golongan_tarif: values.golonganTarif,
        daya_baru: Number(values.dayaBaru),
        ...(values.requestType === "Perubahan daya"
          ? {
              daya_lama: Number(values.dayaLama),
              golongan_tarif_lama: values.golonganTarifLama,
              ...(selectedDayaLama?.pembatas
                ? { pembatas_lama: selectedDayaLama.pembatas }
                : {}),
            }
          : {}),
        ...(selectedDayaBaru?.pembatas
          ? { pembatas_baru: selectedDayaBaru.pembatas }
          : {}),
        evidence_files: values.files,
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
            <fieldset className="min-w-0" disabled={formBusy}>
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
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal pembayaran</FormLabel>
                        <FormControl>
                          <DatePicker {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nominal pembayaran (Rp)</FormLabel>
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            placeholder="150000"
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
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (!draft) keepValidTariffFields(toApiJenis(value));
                        }}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(roleId === "nps" || draft) && (
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit / ULP</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={formBusy || roleId !== "nps"}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background h-11 w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[...units, ...(draft?.unit && !units.includes(draft.unit as typeof units[number]) ? [draft.unit] : [])].map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}{draft?.unit === option && !units.includes(option as typeof units[number]) ? " (import, periksa ULP)" : ""}
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
                          placeholder="Jl. Pahlawan No. 10, Surabaya"
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
                  name="jenisPembayaran"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Jenis pembayaran</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={busy}>
                        <FormControl><SelectTrigger className="bg-background h-11 w-full"><SelectValue placeholder="Pilih jenis pembayaran" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="pascabayar">Pascabayar</SelectItem>
                          <SelectItem value="prabayar">Prabayar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tarif"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tarif</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("golonganTarif", "");
                          form.setValue("golonganTarifLama", "");
                          form.setValue("dayaBaru", "");
                          form.setValue("dayaLama", "");
                        }}
                        disabled={busy || tariffLoading || !tarifChoices.length}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background h-11 w-full">
                            <SelectValue
                              placeholder={
                                tariffLoading
                                  ? "Memuat tarif..."
                                  : !apiJenis && !draft
                                    ? "Pilih jenis sambungan dulu"
                                    : "Pilih tarif"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tarifChoices.map((value) => (
                            <SelectItem key={value} value={value}>
                                {tariffDisplayLabel(value)}{draft?.tarif === value && !detailedTariffs.some((option) => option.tarif === value && inTariffScope(option)) ? " (import, perlu diperbaiki)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {Boolean(tariffError) && (
                        <p className="text-destructive mt-2 text-sm">
                          Daftar tarif gagal dimuat.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requestType === "Perubahan daya" && (
                  <FormField
                    control={form.control}
                    name="golonganTarifLama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Golongan tarif lama</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("dayaLama", "");
                          }}
                          disabled={busy || !tarif || !golonganLamaChoices.length}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background h-11 w-full">
                              <SelectValue placeholder="Pilih golongan tarif lama" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {golonganLamaChoices.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}{draft?.golonganTarifLama === value && !detailedTariffs.some((option) => option.tarif === tarif && inTariffScope(option) && option.golongan_tarif === value) ? " (import, perlu diperbaiki)" : ""}
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
                  name="golonganTarif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {requestType === "Perubahan daya"
                          ? "Golongan tarif baru"
                          : "Golongan tarif"}
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("dayaBaru", "");
                        }}
                        disabled={busy || !tarif || !golonganChoices.length}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background h-11 w-full">
                            <SelectValue placeholder="Pilih golongan tarif" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {golonganChoices.map((value) => (
                            <SelectItem key={value} value={value}>
                                {value}{draft?.golonganTarif === value && !detailedTariffs.some((option) => option.tarif === tarif && inTariffScope(option) && option.golongan_tarif === value) ? " (import, perlu diperbaiki)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requestType === "Perubahan daya" && (
                  <FormField
                    control={form.control}
                    name="dayaLama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daya lama</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={
                            busy || !golonganTarifLama || !dayaLamaChoices.length
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background h-11 w-full">
                              <SelectValue
                                placeholder={
                                  golonganTarifLama
                                    ? "Pilih daya lama"
                                    : "Pilih golongan tarif lama dulu"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            side="bottom"
                            avoidCollisions={false}
                            className="max-h-60"
                          >
                            {dayaLamaChoices.map((option) => (
                              <SelectItem
                                key={option.daya_min}
                                value={String(option.daya_min)}
                              >
                                {exactPowerLabel(option)}
                              </SelectItem>
                            ))}
                            {draft?.dayaLama && !dayaLamaChoices.some((option) => option.daya_min === draft.dayaLama) && <SelectItem value={String(draft.dayaLama)}>{draft.dayaLama} VA (import, perlu diperbaiki)</SelectItem>}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="dayaBaru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {requestType === "Perubahan daya"
                          ? "Daya baru"
                          : "Permohonan daya"}
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={busy || !golonganTarif || !dayaChoices.length}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background h-11 w-full">
                            <SelectValue
                              placeholder={
                                golonganTarif
                                  ? "Pilih daya"
                                  : "Pilih golongan tarif dulu"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          side="bottom"
                          avoidCollisions={false}
                          className="max-h-60"
                        >
                          {dayaChoices.map((option) => (
                            <SelectItem
                              key={option.daya_min}
                              value={String(option.daya_min)}
                            >
                              {exactPowerLabel(option)}
                            </SelectItem>
                          ))}
                          {draft?.dayaBaru && !dayaChoices.some((option) => option.daya_min === draft.dayaBaru) && <SelectItem value={String(draft.dayaBaru)}>{draft.dayaBaru} VA (import, perlu diperbaiki)</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="files"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Evidence permohonan</FormLabel>
                      <FormControl>
                        <EvidenceUploader
                          files={field.value}
                          disabled={busy}
                          onFilesChange={(files) => {
                            field.onChange(files);
                            void form.trigger("files");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {savedNotice && <p role="status" className="text-success mt-4 text-sm">{savedNotice}</p>}
              {Boolean(requestError) && (
                <ErrorNotice
                  error={requestError}
                  onRetry={draft ? undefined : () => void form.handleSubmit(handleSubmit)()}
                  retrying={formBusy}
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
                {draft && <Button type="button" variant="outline" className="min-h-11" onClick={() => void handleSaveDraft()}>{savingDraft ? "Menyimpan..." : "Simpan draft"}</Button>}
                <Button type="submit" className="min-h-11">
                  {busy && <LoaderCircle className="animate-spin" aria-hidden="true" />}
                  {busy ? "Menyimpan..." : draft ? "Lanjutkan" : "Simpan permohonan"}
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
