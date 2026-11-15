"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import {
  AppShell,
  canCreatePermohonan,
} from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { importEIS } from "@/lib/applications";

const MAX_EIS_SIZE = 10 * 1024 * 1024;

export default function ImportEISPage() {
  const { user, error: sessionError } = useSession();
  const roleId = user?.role ?? "user";
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<unknown>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setMessage("Pilih berkas .xls terlebih dahulu.");
    if (!/\.xls$/i.test(file.name))
      return setMessage("Berkas harus berformat .xls.");
    if (file.size > MAX_EIS_SIZE)
      return setMessage("Ukuran berkas maksimal 10 MB.");
    setMessage("");
    setError(null);
    setBusy(true);
    try {
      const drafts = await importEIS(file);
      setMessage(`${drafts.length} draft berhasil diimpor.`);
      toast.success(`${drafts.length} draft berhasil diimpor.`);
      router.push("/permohonan/draft");
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell active="applications" roleId={roleId} user={user}>
      <div className="mx-auto max-w-3xl">
        <Link
          href="/permohonan/draft"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Lihat draft
        </Link>
        <header className="mt-5 border-b pb-6">
          <h1 className="font-display text-2xl font-semibold">Import EIS</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Unggah satu berkas EIS .xls. Setiap baris yang valid dibuat sebagai
            draft permohonan.
          </p>
        </header>
        {Boolean(sessionError) && (
          <ErrorNotice
            error={sessionError}
            onRetry={() => window.location.reload()}
          />
        )}
        {!user && !sessionError && <p role="status" className="mt-6 text-sm">Memuat akun...</p>}
        {user && !canCreatePermohonan(roleId) && (
          <p className="mt-6">Peran Anda tidak dapat mengimpor EIS.</p>
        )}
        {user && canCreatePermohonan(roleId) && (
          <form
            onSubmit={(event) => void submit(event)}
            className="mt-6 space-y-5"
            noValidate
          >
            <div>
              <label htmlFor="eis-file" className="text-sm font-medium">
                Berkas EIS
              </label>
              <Input
                id="eis-file"
                type="file"
                accept=".xls"
                className="mt-2 h-11"
                disabled={busy}
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setMessage("");
                  setError(null);
                }}
              />
            </div>
            {message && (
              <p role="status" className="text-sm">
                {message}
              </p>
            )}
            {Boolean(error) && <ErrorNotice error={error} />}
            <Button type="submit" disabled={busy} className="min-h-11">
              {busy ? "Mengunggah..." : "Import EIS"}
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
