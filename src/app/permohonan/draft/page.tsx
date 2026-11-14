"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  AppShell,
  canCreatePermohonan,
} from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { getDraftPage } from "@/lib/applications";
import type { Application } from "@/lib/workflow";

export default function DraftListPage() {
  const { user, error: sessionError } = useSession();
  const roleId = user?.role ?? "user";
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Application[]>([]);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!user || !canCreatePermohonan(roleId)) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDraftPage(page, search)
      .then((result) => {
        if (cancelled) return;
        setItems(result.applications);
        setMaxPage(result.pagination?.max_page ?? 1);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, roleId, page, search, reload]);

  return (
    <AppShell active="applications" roleId={roleId} user={user}>
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard?view=all"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Daftar permohonan
        </Link>
        <header className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">
              Draft permohonan
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Lengkapi data hasil import sebelum memulai workflow.
            </p>
          </div>
          {user && canCreatePermohonan(roleId) && (
            <Button asChild>
              <Link href="/permohonan/import-eis">Import EIS</Link>
            </Button>
          )}
        </header>
        {Boolean(sessionError) && (
          <ErrorNotice
            error={sessionError}
            onRetry={() => window.location.reload()}
          />
        )}
        {!user && !sessionError && <p role="status" className="mt-6 text-sm">Memuat akun...</p>}
        {user && !canCreatePermohonan(roleId) && (
          <p className="mt-6">Peran Anda tidak dapat melihat draft import.</p>
        )}
        {user && canCreatePermohonan(roleId) && (
          <>
            <form
              className="my-5 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setSearch(searchInput.trim());
              }}
            >
              <label htmlFor="draft-search" className="sr-only">
                Cari draft
              </label>
              <Input
                id="draft-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nomor atau pelanggan"
                className="max-w-md"
              />
              <Button type="submit" variant="outline">
                Cari
              </Button>
            </form>
            {Boolean(error) && (
              <ErrorNotice
                error={error}
                onRetry={() => setReload((value) => value + 1)}
              />
            )}
            <div
              className="overflow-x-auto rounded-lg border"
              role="region"
              aria-label="Daftar draft"
              tabIndex={0}
            >
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3">No. permohonan</th>
                    <th className="p-3">Pelanggan</th>
                    <th className="p-3">Jenis sambungan</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {!loading &&
                    !error &&
                    items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-medium">{item.number}</td>
                        <td className="p-3">{item.customer}</td>
                        <td className="p-3">{item.connectionType}</td>
                        <td className="p-3">{item.unit}</td>
                        <td className="p-3">Draft</td>
                        <td className="p-3">
                          <Link
                            className="text-primary underline-offset-2 hover:underline"
                            href={`/permohonan/${item.id}/draft`}
                          >
                            Lengkapi draft
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {loading && (
                <p role="status" className="p-6 text-sm">
                  Memuat draft...
                </p>
              )}
              {!loading && !error && items.length === 0 && (
                <p className="p-6 text-sm">
                  {search
                    ? "Tidak ada draft yang sesuai pencarian."
                    : "Belum ada draft. Import EIS untuk membuat draft."}
                </p>
              )}
            </div>
            {!loading && !error && maxPage > 1 && (
              <nav
                className="mt-4 flex items-center gap-3"
                aria-label="Halaman draft"
              >
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm">
                  Halaman {page} dari {maxPage}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= maxPage}
                  onClick={() => setPage(page + 1)}
                >
                  Berikutnya
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
