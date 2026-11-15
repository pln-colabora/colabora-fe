"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { FileSpreadsheet, Search, X } from "lucide-react";

import {
  AppShell,
  canCreatePermohonan,
} from "@/components/dashboard/app-shell";
import { DraftTable } from "@/components/dashboard/draft-table";
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

  // Same behaviour as the permohonan list: search while typing, applied after
  // a short pause so every keystroke does not hit the API.
  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return;
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);
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
              <Link href="/permohonan/import-eis">
                <FileSpreadsheet aria-hidden="true" />
                Import EIS
              </Link>
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
            <div className="relative my-5">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nomor atau pelanggan"
                aria-label="Cari draft"
                className="h-11 pr-9 pl-9"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 focus-visible:outline-2"
                  aria-label="Hapus pencarian"
                  title="Hapus pencarian"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <DraftTable
              items={items}
              loading={loading}
              error={error}
              emptyText={
                search
                  ? "Tidak ada draft yang sesuai pencarian."
                  : "Belum ada draft. Import EIS untuk membuat draft."
              }
              onRetry={() => setReload((value) => value + 1)}
              onDeleted={(count) => {
                if (count >= items.length && page > 1) setPage(page - 1);
                else setReload((value) => value + 1);
              }}
            />
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
