"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ErrorNotice } from "@/components/dashboard/error-notice";
import {
  EvidenceUploader,
  type EvidenceFileStatus,
} from "@/components/dashboard/evidence-uploader";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  assignVendor,
  getVendorAccounts,
  submitAction,
  uploadEvidence,
} from "@/lib/applications";
import { presentApiError } from "@/lib/error-utils";
import { isValidDateValue } from "@/lib/utils";
import {
  getActivity,
  getRole,
  nodeActions,
  type Application,
  type AvailableAction,
  type FieldDefinition,
  type RoleId,
} from "@/lib/workflow";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const acceptedFile = /\.(pdf|jpe?g|png)$/i;

function createActionSchema(fields: FieldDefinition[]) {
  const shape = Object.fromEntries(
    fields.map((field) => {
      let schema = z.string().trim();
      if (field.required)
        schema = schema.min(1, `${field.label} wajib diisi.`);
      if (field.maxLength)
        schema = schema.max(
          field.maxLength,
          `${field.label} maksimal ${field.maxLength} karakter.`,
        );
      if (field.type === "date")
        schema = schema.refine(
          (value) => !value || isValidDateValue(value),
          "Format tanggal tidak valid.",
        );
      if (field.type === "number")
        schema = schema.refine(
          (value) => !value || Number.isFinite(Number(value)),
          "Nilai harus berupa angka.",
        );
      if (field.type === "select" && field.options)
        schema = schema.refine(
          (value) => !value || field.options?.includes(value),
          "Pilihan tidak valid.",
        );
      return [field.name, schema];
    }),
  ) as Record<string, z.ZodString>;

  return z.object({
    values: z.object(shape),
    files: z
      .array(
        z
          .custom<File>(
            (value) => typeof File !== "undefined" && value instanceof File,
            "Berkas evidence tidak valid.",
          )
          .refine(
            (file) => file.size <= MAX_FILE_SIZE,
            "Ukuran setiap evidence maksimal 10 MB.",
          )
          .refine(
            (file) => acceptedFile.test(file.name),
            "Evidence harus berupa PDF, JPG, JPEG, atau PNG.",
          ),
      )
      .min(1, "Pilih minimal satu evidence."),
  });
}

type ActionFormValues = {
  values: Record<string, string>;
  files: File[];
};

export function ActionForm({
  application,
  action,
  onCancel,
  onSaved,
  embedded = false,
  onDirtyChange,
}: {
  application: Application;
  action: AvailableAction;
  onCancel: () => void;
  onSaved: (application: Application) => void;
  embedded?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  // Combined endpoints use one form; the server completes the associated nodes atomically.
  const formNode =
    (
      {
        nps_delegation: "permohonan_perluasan",
        tera_app: "reservasi_material",
        arsip_ail: "entri_mutasi_pdl",
        selesai: "entri_mutasi_pdl",
      } as Record<string, string>
    )[action.workflow_node] ?? action.workflow_node;
  const activity = getActivity(nodeActions[formNode]);
  // Each WO also assigns the vendor that will receive it, so the picker is part
  // of the WO form (mandatory) instead of a separate step. SR/APP has no
  // dedicated vendor on PLG TM — the construction vendor handles it there.
  const vendorRole: RoleId | null = (() => {
    const node = formNode.replaceAll("-", "_");
    if (node === "wo_tiang") return "vendor-tiang";
    if (node === "wo_konstruksi") return "vendor-konstruksi";
    if (node === "wo_app" && !application.connectionType.startsWith("PLG TM"))
      return "vendor-sr-app";
    return null;
  })();
  const vendorLabel = vendorRole ? getRole(vendorRole).label : "";
  const vendorField: FieldDefinition | null = vendorRole
    ? { name: "vendor_id", label: vendorLabel, required: true }
    : null;
  const baseFields = activity?.fields ?? [];
  const schemaFields = vendorField ? [...baseFields, vendorField] : baseFields;
  const schema = useMemo(
    () => createActionSchema(schemaFields),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity, vendorRole],
  );
  const form = useForm<ActionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      values: Object.fromEntries(schemaFields.map((field) => [field.name, ""])),
      files: [],
    },
  });
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState<unknown>(null);
  const assignedVendor = useRef(false);

  useEffect(() => {
    if (!vendorRole) return;
    let cancelled = false;
    setVendorLoading(true);
    setVendorError(null);
    getVendorAccounts(vendorRole)
      .then((data) => {
        if (!cancelled)
          setVendors(data.map((item) => ({ id: item.id, name: item.name })));
      })
      .catch((error: unknown) => {
        if (!cancelled) setVendorError(error);
      })
      .finally(() => {
        if (!cancelled) setVendorLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vendorRole]);
  const uploads = useRef(new Map<File, string>());
  const [fileStatuses, setFileStatuses] = useState(
    new Map<File, EvidenceFileStatus>(),
  );
  const [requestError, setRequestError] = useState<unknown>(null);
  const busy = form.formState.isSubmitting;
  const { confirmDiscard, dialog: unsavedDialog } = useUnsavedChanges(
    form.formState.isDirty,
  );
  const { confirm: confirmAction, dialog: actionDialog } = useConfirmDialog();
  const activityLabel = activity?.label ?? "aktivitas ini";

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
    return () => onDirtyChange?.(false);
  }, [form.formState.isDirty, onDirtyChange]);

  if (!activity)
    return (
      <p role="alert">Formulir aktivitas belum tersedia. Muat ulang detail.</p>
    );

  const beforeNotes = baseFields.filter((field) => field.name !== "notes");
  const notesDef = baseFields.find((field) => field.name === "notes");

  const renderField = (definition: FieldDefinition) => (
    <FormField
      key={definition.name}
      control={form.control}
      name={`values.${definition.name}`}
      render={({ field }) => (
        <FormItem
          className={definition.type === "textarea" ? "md:col-span-2" : ""}
        >
          <FormLabel>
            {definition.label}
            {!definition.required && (
              <span className="text-muted-foreground font-normal">
                {" "}
                (opsional)
              </span>
            )}
          </FormLabel>
          {definition.type === "textarea" ? (
            <FormControl>
              <Textarea
                maxLength={definition.maxLength}
                className="bg-background min-h-24"
                {...field}
              />
            </FormControl>
          ) : definition.type === "select" ? (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={busy}
            >
              <FormControl>
                <SelectTrigger className="bg-background h-11 w-full">
                  <SelectValue placeholder="Pilih keputusan" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {definition.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : definition.type === "date" ? (
            <FormControl>
              <DatePicker {...field} disabled={busy} />
            </FormControl>
          ) : (
            <FormControl>
              <Input
                type={definition.type ?? "text"}
                maxLength={definition.maxLength}
                className="bg-background h-11"
                {...field}
              />
            </FormControl>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  async function submit(data: ActionFormValues) {
    if (
      !(await confirmAction({
        title: "Lanjutkan aktivitas?",
        description: `Simpan aktivitas “${activityLabel}” dan lanjutkan workflow permohonan ini.`,
        confirmLabel: "Simpan & lanjutkan",
      }))
    )
      return;
    setRequestError(null);
    try {
      for (const file of data.files) {
        if (!uploads.current.has(file)) {
          setFileStatus(file, { state: "uploading", progress: 0 });
          try {
            const document = await uploadEvidence(file, (progress) =>
              setFileStatus(file, { state: "uploading", progress }),
            );
            uploads.current.set(file, document.id);
            setFileStatus(file, { state: "uploaded", progress: 100 });
          } catch (error) {
            setFileStatus(file, { state: "failed" });
            throw error;
          }
        }
      }
      // Assign the vendor first so the completed WO is visible to them.
      // Guarded by a ref so a retry after a later failure does not re-assign.
      if (vendorRole && !assignedVendor.current) {
        await assignVendor(application.id, data.values.vendor_id, vendorRole);
        assignedVendor.current = true;
      }
      const updated = await submitAction(
        application.id,
        action,
        data.values,
        data.files.map((file) => uploads.current.get(file)!),
      );
      toast.success("Aktivitas berhasil disimpan.");
      onSaved(updated);
    } catch (error) {
      const message = presentApiError(error, "Aktivitas gagal disimpan.").message;
      setRequestError(error);
      toast.error(message);
    }
  }

  function setFileStatus(file: File, status: EvidenceFileStatus) {
    setFileStatuses((current) => {
      const next = new Map(current);
      next.set(file, status);
      return next;
    });
  }

  return (
    <>
      {unsavedDialog}
      {actionDialog}
      <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className={
          embedded
            ? "min-w-0"
            : "border-border mt-5 min-w-0 border-t pt-5"
        }
        noValidate
      >
        <fieldset className="min-w-0" disabled={busy}>
          <div className="grid gap-4 md:grid-cols-2">
            {beforeNotes.map(renderField)}
            {vendorRole ? (
              <FormField
                control={form.control}
                name="values.vendor_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{vendorLabel}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={busy || vendorLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background h-11 w-full">
                          <SelectValue
                            placeholder={
                              vendorLoading
                                ? "Memuat vendor..."
                                : `Pilih ${vendorLabel.toLowerCase()}`
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!vendorLoading && !vendorError && !vendors.length && (
                      <p className="text-muted-foreground mt-2 text-sm">
                        Belum ada akun {vendorLabel.toLowerCase()}.
                      </p>
                    )}
                    {Boolean(vendorError) && (
                      <p className="text-destructive mt-2 text-sm">
                        Daftar vendor gagal dimuat.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            {notesDef ? renderField(notesDef) : null}
          </div>

          <FormField
            control={form.control}
            name="files"
            render={({ field }) => (
              <FormItem className="mt-5 min-w-0">
                <FormLabel>Evidence aktivitas</FormLabel>
                <FormControl>
                  <EvidenceUploader
                    files={field.value}
                    statuses={fileStatuses}
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

          {Boolean(requestError) && (
            <ErrorNotice
              error={requestError}
              onRetry={() => void form.handleSubmit(submit)()}
              retrying={busy}
            />
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => {
                void confirmDiscard().then((confirmed) => {
                  if (confirmed) onCancel();
                });
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="h-auto min-h-11 w-full whitespace-normal sm:w-auto"
            >
              {busy && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {busy ? "Menyimpan..." : "Simpan dan selesaikan aktivitas"}
            </Button>
          </div>
        </fieldset>
      </form>
      </Form>
    </>
  );
}
