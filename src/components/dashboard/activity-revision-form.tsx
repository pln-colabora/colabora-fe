"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { ErrorNotice } from "@/components/dashboard/error-notice";
import { EvidenceUploader } from "@/components/dashboard/evidence-uploader";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  getRevisionContext,
  saveActivityRevision,
  type ActivityDetail,
  type ActivityRevision,
} from "@/lib/activity-revisions";
import {
  uploadEvidence,
  downloadApplicationDocument,
} from "@/lib/applications";
import { formatApiDate, isValidDateValue } from "@/lib/utils";

export function ActivityRevisionForm({
  id,
  node,
  onSaved,
}: {
  id: string;
  node: "survei" | "wo_konstruksi";
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ActivityDetail>();
  const [history, setHistory] = useState<ActivityRevision[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Map<File, string>>(new Map());
  const [uploaded, setUploaded] = useState<Map<File, string>>(new Map());
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);
  const { confirm, dialog } = useConfirmDialog();
  const survey = node === "survei";
  const originalIDs =
    current?.documents
      .filter((doc) => doc.source === "uploaded")
      .map((doc) => doc.id) ?? [];
  const dirty =
    open &&
    Boolean(current) &&
    (files.length > 0 ||
      selected.length !== originalIDs.length ||
      selected.some((id) => !originalIDs.includes(id)) ||
      (survey &&
        (date !== String(current?.payload.surveyed_at ?? "") ||
          notes !== String(current?.payload.notes ?? ""))));
  const { confirmDiscard, dialog: unsavedDialog } = useUnsavedChanges(
    dirty && !saving,
  );
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getRevisionContext(id, node)
      .then(({ current, history }) => {
        if (cancelled) return;
        setCurrent(current);
        setHistory(history);
        setSelected(
          current.documents
            .filter((doc) => doc.source === "uploaded")
            .map((doc) => doc.id),
        );
        setDate(String(current.payload.surveyed_at ?? ""));
        setNotes(String(current.payload.notes ?? ""));
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, id, node, version]);
  async function save() {
    if (!current) return;
    if (!selected.length && !files.length) {
      setError(new Error("Pilih minimal satu lampiran."));
      return;
    }
    if (survey && !isValidDateValue(date)) {
      setError(new Error("Tanggal survei tidak valid."));
      return;
    }
    if (
      files.some(
        (file) =>
          file.size > 30 * 1024 * 1024 ||
          !/\.(pdf|jpe?g|png|xlsx?)$/i.test(file.name),
      )
    ) {
      setError(
        new Error(
          "Lampiran maksimal 30 MB, berformat PDF, gambar, XLS, atau XLSX.",
        ),
      );
      return;
    }
    if (
      !(await confirm({
        title: "Simpan revisi?",
        description:
          "Revisi menyimpan riwayat data sebelumnya. Status, waktu penyelesaian, dan tenggat SLA tetap.",
        confirmLabel: "Simpan revisi",
      }))
    )
      return;
    setSaving(true);
    setError(null);
    try {
      const ids = [...selected];
      for (const file of files) {
        let fileID = uploaded.get(file);
        if (!fileID) {
          fileID = (
            await uploadEvidence(
              file,
              undefined,
              categories.get(file) ?? "evidence",
            )
          ).id;
          setUploaded((previous) => new Map(previous).set(file, fileID!));
        }
        ids.push(fileID);
      }
      await saveActivityRevision(
        id,
        node,
        current.revision,
        ids,
        survey ? { surveyed_at: date, notes } : undefined,
      );
      toast.success("Revisi berhasil disimpan.");
      setFiles([]);
      setUploaded(new Map());
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }
  async function download(id: string) {
    try {
      const blob = await downloadApplicationDocument(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lampiran-${id}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <section className="mt-3 border-t pt-3">
      {dialog}
      {unsavedDialog}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          void confirmDiscard().then((confirmed) => {
            if (confirmed) {
              setOpen(!open);
              setFiles([]);
              setUploaded(new Map());
            }
          });
        }}
        disabled={saving}
      >
        {open
          ? "Tutup revisi"
          : survey
            ? "Edit survei & riwayat"
            : "Edit lampiran WO & riwayat"}
      </Button>
      {open && (
        <div className="mt-3 space-y-3">
          {Boolean(error) && (
            <ErrorNotice
              error={error}
              onRetry={() => setVersion((value) => value + 1)}
            />
          )}
          {loading ? (
            <p role="status" className="text-sm">
              Memuat revisi…
            </p>
          ) : (
            current && (
              <>
                <p className="text-muted-foreground text-xs">
                  Revisi aktif {current.revision}. Data penyelesaian dan SLA
                  tetap.
                </p>
                {survey && (
                  <>
                    <label htmlFor={`${node}-date`} className="block text-sm">
                      Tanggal survei
                    </label>
                    <DatePicker
                      id={`${node}-date`}
                      value={date}
                      onChange={setDate}
                      disabled={saving}
                    />
                    <label htmlFor={`${node}-notes`} className="block text-sm">
                      Catatan
                    </label>
                    <Textarea
                      id={`${node}-notes`}
                      value={notes}
                      maxLength={2000}
                      onChange={(event) => setNotes(event.target.value)}
                      disabled={saving}
                    />
                  </>
                )}
                <p className="text-sm font-medium">Lampiran aktif</p>
                {current.documents.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={
                        doc.source !== "uploaded" || selected.includes(doc.id)
                      }
                      disabled={saving || doc.source !== "uploaded"}
                      onChange={(event) =>
                        setSelected((previous) =>
                          event.target.checked
                            ? [...previous, doc.id]
                            : previous.filter((id) => id !== doc.id),
                        )
                      }
                    />
                    {doc.original_filename}
                    {doc.source !== "uploaded"
                      ? " · dokumen sistem terkunci"
                      : ""}
                  </label>
                ))}
                <EvidenceUploader
                  files={files}
                  onFilesChange={setFiles}
                  disabled={saving}
                />
                {survey &&
                  files.map((file, index) => (
                    <div key={index}>
                      <label
                        className="text-sm"
                        htmlFor={`revision-category-${index}`}
                      >
                        Jenis lampiran: {file.name}
                      </label>
                      <select
                        id={`revision-category-${index}`}
                        className="bg-background block w-full rounded-md border p-2 text-sm"
                        disabled={saving || uploaded.has(file)}
                        value={categories.get(file) ?? "evidence"}
                        onChange={(event) =>
                          setCategories((previous) =>
                            new Map(previous).set(file, event.target.value),
                          )
                        }
                      >
                        <option value="evidence">Evidence survei</option>
                        <option value="izin_pemilik_tanah">
                          Izin pemilik tanah
                        </option>
                        <option value="izin_perangkat_desa">
                          Izin perangkat desa
                        </option>
                        <option value="izin_pemilik_tanah_dan_perangkat_desa">
                          Izin pemilik tanah dan perangkat desa
                        </option>
                      </select>
                    </div>
                  ))}
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                >
                  {saving ? "Menyimpan…" : "Simpan revisi"}
                </Button>
                <h4 className="pt-3 text-sm font-medium">Riwayat revisi</h4>
                {!history.length && (
                  <p className="text-muted-foreground text-sm">
                    Belum ada revisi sebelumnya.
                  </p>
                )}
                {history.map((row) => (
                  <details key={row.revision} className="border-b py-2 text-sm">
                    <summary>
                      Revisi {row.revision} ·{" "}
                      {formatApiDate(row.created_at, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </summary>
                    {survey && (
                      <p className="mt-2 whitespace-pre-wrap">
                        Tanggal survei: {String(row.payload.surveyed_at ?? "—")}
                        <br />
                        {String(row.payload.notes ?? "")}
                      </p>
                    )}
                    <ul>
                      {row.document_ids.map((documentID, index) => (
                        <li key={documentID}>
                          <button
                            type="button"
                            className="mt-2 underline"
                            onClick={() => void download(documentID)}
                          >
                            Unduh lampiran {index + 1}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </>
            )
          )}
        </div>
      )}
    </section>
  );
}
