"use client";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitAction, uploadEvidence } from "@/lib/applications";
import {
  getActivity,
  nodeActions,
  type Application,
  type AvailableAction,
} from "@/lib/workflow";

export function ActionForm({
  application,
  action,
  onCancel,
  onSaved,
}: {
  application: Application;
  action: AvailableAction;
  onCancel: () => void;
  onSaved: (application: Application) => void;
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
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const uploads = useRef(new Map<File, string>());
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!activity)
    return (
      <p role="alert">Formulir aktivitas belum tersedia. Muat ulang detail.</p>
    );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      if (files.length === 0) throw new Error("Pilih minimal satu evidence.");
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024)
          throw new Error("Ukuran setiap evidence maksimal 10 MB.");
        if (!uploads.current.has(file))
          uploads.current.set(file, (await uploadEvidence(file)).id);
      }
      const updated = await submitAction(
        application.id,
        action,
        values,
        files.map((file) => uploads.current.get(file)!),
      );
      onSaved(updated);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Aktivitas gagal disimpan.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="border-warning-border mt-5 border-t pt-5"
    >
      <fieldset disabled={busy}>
        <div className="grid gap-4 md:grid-cols-2">
          {activity.fields.map((field) => (
            <div
              key={field.name}
              className={field.type === "textarea" ? "md:col-span-2" : ""}
            >
              <Label htmlFor={"field-" + field.name}>
                {field.label}
                {!field.required && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    (opsional)
                  </span>
                )}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={"field-" + field.name}
                  value={values[field.name] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                  required={field.required}
                  maxLength={field.maxLength}
                  className="bg-background mt-2 min-h-24"
                />
              ) : field.type === "select" ? (
                <Select
                  value={values[field.name] ?? ""}
                  onValueChange={(value) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: value,
                    }))
                  }
                  required={field.required}
                  disabled={busy}
                >
                  <SelectTrigger
                    id={"field-" + field.name}
                    className="bg-background mt-2 h-11 w-full"
                  >
                    <SelectValue placeholder="Pilih keputusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={"field-" + field.name}
                  type={field.type ?? "text"}
                  value={values[field.name] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                  required={field.required}
                  maxLength={field.maxLength}
                  className="bg-background mt-2 h-11"
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Label htmlFor="evidence">
            Evidence aktivitas (PDF/JPG/PNG, maksimal 10 MB per berkas)
          </Label>
          <Input
            id="evidence"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="mt-2 h-11"
            onChange={(event) => {
              setFiles(Array.from(event.target.files ?? []));
              setError("");
            }}
          />
        </div>
        {error && (
          <p role="alert" className="text-destructive mt-4 text-sm">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={onCancel}
          >
            Batal
          </Button>
          <Button type="submit" className="min-h-11">
            {busy ? "Menyimpan..." : "Simpan dan selesaikan aktivitas"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
