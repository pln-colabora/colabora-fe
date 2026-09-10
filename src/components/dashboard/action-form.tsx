"use client";

import { useMemo, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { submitAction, uploadEvidence } from "@/lib/applications";
import { isValidDateValue } from "@/lib/utils";
import {
  getActivity,
  nodeActions,
  type Application,
  type AvailableAction,
  type FieldDefinition,
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
}: {
  application: Application;
  action: AvailableAction;
  onCancel: () => void;
  onSaved: (application: Application) => void;
  embedded?: boolean;
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
  const schema = useMemo(
    () => createActionSchema(activity?.fields ?? []),
    [activity],
  );
  const form = useForm<ActionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      values: Object.fromEntries(
        (activity?.fields ?? []).map((field) => [field.name, ""]),
      ),
      files: [],
    },
  });
  const uploads = useRef(new Map<File, string>());
  const [fileStatuses, setFileStatuses] = useState(
    new Map<File, EvidenceFileStatus>(),
  );
  const busy = form.formState.isSubmitting;

  if (!activity)
    return (
      <p role="alert">Formulir aktivitas belum tersedia. Muat ulang detail.</p>
    );

  async function submit(data: ActionFormValues) {
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
      const updated = await submitAction(
        application.id,
        action,
        data.values,
        data.files.map((file) => uploads.current.get(file)!),
      );
      toast.success("Aktivitas berhasil disimpan.");
      onSaved(updated);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Aktivitas gagal disimpan.";
      form.setError("root", { message });
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
            {activity.fields.map((definition) => (
              <FormField
                key={definition.name}
                control={form.control}
                name={`values.${definition.name}`}
                render={({ field }) => (
                  <FormItem
                    className={
                      definition.type === "textarea" ? "md:col-span-2" : ""
                    }
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
                        <DatePicker
                          {...field}
                          disabled={busy}
                        />
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
            ))}
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

          {form.formState.errors.root?.message && (
            <p
              role="alert"
              className="text-destructive mt-4 min-w-0 break-words text-sm"
            >
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={onCancel}
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
  );
}
