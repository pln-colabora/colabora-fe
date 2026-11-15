"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { LoaderCircle, PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ErrorNotice } from "@/components/dashboard/error-notice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { ApiError } from "@/lib/api";
import { deleteDraft } from "@/lib/applications";
import { presentApiError } from "@/lib/error-utils";
import type { Application } from "@/lib/workflow";

// Draft rows shared by the Import EIS page (latest drafts) and the full draft
// list. The caller owns loading; this component owns deleting rows, one at a
// time or as a selection (the API deletes one draft per request).
export function DraftTable({
  items,
  loading,
  error,
  emptyText,
  onRetry,
  onDeleted,
}: {
  items: Application[];
  loading: boolean;
  error: unknown;
  emptyText: string;
  onRetry: () => void;
  onDeleted: (count: number) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { confirm, dialog } = useConfirmDialog();
  const busy = deletingId !== null || bulkDeleting;

  // A new page or search replaces the rows; drop selections that left the view.
  useEffect(() => {
    setSelected((previous) => {
      const visible = new Set(items.map((item) => item.id));
      const next = new Set([...previous].filter((id) => visible.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [items]);

  const allSelected = items.length > 0 && selected.size === items.length;

  function toggle(id: string, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleDelete(item: Application) {
    if (
      busy ||
      !(await confirm({
        title: "Hapus draft ini?",
        description: `Draft ${item.number} akan dihapus permanen dan tidak dapat dipulihkan.`,
        confirmLabel: "Hapus draft",
        destructive: true,
      }))
    )
      return;

    setDeletingId(item.id);
    try {
      await deleteDraft(item.id);
      toast.success("Draft berhasil dihapus.");
      toggle(item.id, false);
      onDeleted(1);
    } catch (requestError) {
      toast.error(
        presentApiError(requestError, "Draft tidak dapat dihapus.").message,
      );
      if (
        requestError instanceof ApiError &&
        [404, 409].includes(requestError.status)
      )
        onRetry();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBulkDelete() {
    const targets = items.filter((item) => selected.has(item.id));
    if (
      busy ||
      !targets.length ||
      !(await confirm({
        title: `Hapus ${targets.length} draft?`,
        description: `${targets.length} draft terpilih akan dihapus permanen dan tidak dapat dipulihkan.`,
        confirmLabel: `Hapus ${targets.length} draft`,
        destructive: true,
      }))
    )
      return;

    setBulkDeleting(true);
    const failed: Application[] = [];
    for (const item of targets) {
      try {
        await deleteDraft(item.id);
      } catch {
        failed.push(item);
      }
    }
    setBulkDeleting(false);
    const deleted = targets.length - failed.length;
    // Failed rows stay selected so they can be retried.
    setSelected(new Set(failed.map((item) => item.id)));
    if (!failed.length) toast.success(`${deleted} draft berhasil dihapus.`);
    else
      toast.error(
        `${deleted} draft dihapus, ${failed.length} gagal: ${failed
          .map((item) => item.number)
          .join(", ")}.`,
      );
    if (deleted) onDeleted(deleted);
    else onRetry();
  }

  return (
    <>
      {dialog}
      {Boolean(error) && <ErrorNotice error={error} onRetry={onRetry} />}
      {selected.size > 0 && (
        <div
          role="status"
          className="bg-muted/60 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <span>{selected.size} draft dipilih</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setSelected(new Set())}
            >
              Batal pilih
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => void handleBulkDelete()}
            >
              {bulkDeleting ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              {bulkDeleting ? "Menghapus..." : `Hapus ${selected.size} draft`}
            </Button>
          </div>
        </div>
      )}
      <div
        className="overflow-x-auto rounded-lg border"
        role="region"
        aria-label="Daftar draft"
        tabIndex={0}
      >
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-muted">
            <tr className="[&>th]:p-3 [&>th]:text-center [&>th]:font-medium [&>th]:whitespace-nowrap">
              <th className="w-10">
                <Checkbox
                  aria-label="Pilih semua draft di halaman ini"
                  checked={
                    allSelected
                      ? true
                      : selected.size > 0
                        ? "indeterminate"
                        : false
                  }
                  disabled={busy || loading || !items.length}
                  onCheckedChange={(checked) =>
                    setSelected(
                      checked === true
                        ? new Set(items.map((item) => item.id))
                        : new Set(),
                    )
                  }
                />
              </th>
              <th>No. permohonan</th>
              <th>Pelanggan</th>
              <th>Jenis sambungan</th>
              <th>Unit</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!loading &&
              !error &&
              items.map((item) => (
                <tr
                  key={item.id}
                  className={selected.has(item.id) ? "bg-muted/40" : undefined}
                >
                  <td className="p-3 text-center">
                    <Checkbox
                      aria-label={`Pilih draft ${item.number}`}
                      checked={selected.has(item.id)}
                      disabled={busy}
                      onCheckedChange={(checked) =>
                        toggle(item.id, checked === true)
                      }
                    />
                  </td>
                  <td className="p-3 font-mono font-medium whitespace-nowrap">
                    {item.number}
                  </td>
                  <td className="p-3">{item.customer}</td>
                  <td className="p-3">
                    {item.connectionType || (
                      <span className="text-muted-foreground">Belum diisi</span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">{item.unit}</td>
                  <td className="text-muted-foreground p-3">Draft</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/permohonan/${item.id}/draft`}>
                          <PencilLine aria-hidden="true" />
                          Lengkapi
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive size-8"
                        disabled={busy}
                        aria-label={`Hapus draft ${item.number}`}
                        title="Hapus draft"
                        onClick={() => void handleDelete(item)}
                      >
                        {deletingId === item.id ? (
                          <LoaderCircle
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 aria-hidden="true" />
                        )}
                      </Button>
                    </div>
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
          <p className="text-muted-foreground p-6 text-sm">{emptyText}</p>
        )}
      </div>
    </>
  );
}
