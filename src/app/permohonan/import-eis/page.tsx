"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import {
  AppShell,
  canCreatePermohonan,
} from "@/components/dashboard/app-shell";
import { DraftTable } from "@/components/dashboard/draft-table";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import {
  EvidenceUploader,
  type EvidenceFileStatus,
} from "@/components/dashboard/evidence-uploader";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { getDraftPage, importEIS } from "@/lib/applications";
import { presentApiError } from "@/lib/error-utils";
import type { Application } from "@/lib/workflow";

// Matches the API limit for POST /api/permohonan/import-eis.
const MAX_EIS_SIZE = 30 * 1024 * 1024;
const EIS_FORMAT = /\.xlsx?$/i;
const RECENT_DRAFTS = 10;

type ImportFailure = { file: File; message: string };

export default function ImportEISPage() {
  const { user, error: sessionError } = useSession();
  const roleId = user?.role ?? "user";
  const allowed = Boolean(user) && canCreatePermohonan(roleId);

  const [files, setFiles] = useState<File[]>([]);
  const [statuses, setStatuses] = useState<Map<File, EvidenceFileStatus>>(
    new Map(),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failures, setFailures] = useState<ImportFailure[]>([]);

  const [drafts, setDrafts] = useState<Application[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftsError, setDraftsError] = useState<unknown>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    setDraftsLoading(true);
    setDraftsError(null);
    getDraftPage(1, "", RECENT_DRAFTS)
      .then((result) => {
        if (!cancelled) setDrafts(result.applications);
      })
      .catch((requestError) => {
        if (!cancelled) setDraftsError(requestError);
      })
      .finally(() => {
        if (!cancelled) setDraftsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, reload]);

  function setStatus(file: File, status: EvidenceFileStatus) {
    setStatuses((previous) => new Map(previous).set(file, status));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length)
      return setMessage("Pilih minimal satu berkas .xls atau .xlsx.");
    const invalid = files.find(
      (file) => !EIS_FORMAT.test(file.name) || file.size > MAX_EIS_SIZE,
    );
    if (invalid)
      return setMessage(
        `${invalid.name}: berkas harus berformat .xls atau .xlsx dan maksimal 30 MB.`,
      );
    setMessage("");
    setFailures([]);
    setBusy(true);
    // Files go one by one to the single-file endpoint; one failing file does
    // not stop the others, and each outcome is reported separately.
    let imported = 0;
    const failed: ImportFailure[] = [];
    for (const file of files) {
      setStatus(file, { state: "uploading" });
      try {
        imported += (await importEIS(file)).length;
        setStatus(file, { state: "uploaded" });
      } catch (requestError) {
        setStatus(file, { state: "failed" });
        failed.push({
          file,
          message: presentApiError(requestError, "Berkas gagal diimpor.")
            .message,
        });
      }
    }
    setBusy(false);
    setFailures(failed);
    // Keep only the failed files selected so they can be fixed and retried.
    setFiles(failed.map((item) => item.file));
    setStatuses(new Map());
    if (imported) setReload((value) => value + 1);
    if (!failed.length) toast.success(`${imported} draft berhasil diimpor.`);
    else if (imported)
      toast.warning(`${imported} draft diimpor, ${failed.length} berkas gagal.`);
    else toast.error("Semua berkas gagal diimpor.");
  }

  return (
    <AppShell active="applications" roleId={roleId} user={user}>
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard?view=all"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Daftar permohonan
        </Link>
        <header className="mt-5 border-b pb-6">
          <h1 className="font-display text-2xl font-semibold">Import EIS</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Setiap baris yang valid di berkas EIS dibuat sebagai draft
            permohonan. Lengkapi draft sebelum memulai workflow.
          </p>
        </header>
        {Boolean(sessionError) && (
          <ErrorNotice
            error={sessionError}
            onRetry={() => window.location.reload()}
          />
        )}
        {!user && !sessionError && (
          <p role="status" className="mt-6 text-sm">
            Memuat akun...
          </p>
        )}
        {user && !allowed && (
          <p className="mt-6">Peran Anda tidak dapat mengimpor EIS.</p>
        )}
        {allowed && (
          <>
            <section aria-labelledby="upload-title" className="mt-6">
              <form
                onSubmit={(event) => void submit(event)}
                className="bg-card space-y-4 rounded-lg border p-5"
                noValidate
              >
                <h2 id="upload-title" className="text-sm font-medium">
                  Berkas EIS
                </h2>
                <EvidenceUploader
                  aria-labelledby="upload-title"
                  files={files}
                  statuses={statuses}
                  disabled={busy}
                  fileLabel="berkas EIS"
                  accept=".xls,.xlsx"
                  helpText="XLS atau XLSX · maksimal 30 MB per berkas · bisa lebih dari satu berkas"
                  onFilesChange={(next) => {
                    setFiles(next);
                    setMessage("");
                    setFailures([]);
                  }}
                />
                {message && (
                  <p role="alert" className="text-destructive text-sm">
                    {message}
                  </p>
                )}
                {failures.length > 0 && (
                  <ul
                    role="alert"
                    className="border-destructive-border bg-destructive-surface divide-destructive-border divide-y rounded-md border text-sm"
                  >
                    {failures.map(({ file, message: reason }, index) => (
                      <li key={`${file.name}:${index}`} className="px-3 py-2.5">
                        <p className="font-medium break-all">{file.name}</p>
                        <p className="text-destructive mt-0.5">{reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={busy || !files.length}
                    className="min-h-11"
                  >
                    {busy ? "Mengimpor..." : "Import EIS"}
                  </Button>
                </div>
              </form>
            </section>

            <section aria-labelledby="recent-drafts-title" className="mt-8">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id="recent-drafts-title"
                    className="font-display text-lg font-semibold"
                  >
                    Draft terbaru
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {RECENT_DRAFTS} draft terakhir milik Anda.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/permohonan/draft">
                    Lihat semua draft
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <DraftTable
                roleId={roleId}
                items={drafts}
                loading={draftsLoading}
                error={draftsError}
                emptyText="Belum ada draft. Unggah berkas EIS untuk membuat draft."
                onRetry={() => setReload((value) => value + 1)}
                onDeleted={() => setReload((value) => value + 1)}
              />
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
