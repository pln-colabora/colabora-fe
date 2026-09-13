"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { CheckCircle2, FilePlus2, Search, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AppShell, canManageAccounts } from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { DashboardSkeleton } from "@/components/dashboard/page-skeletons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { useUsers } from "@/hooks/use-users";
import { presentApiError } from "@/lib/error-utils";
import { deleteUser } from "@/lib/users";
import { getRole } from "@/lib/workflow";

export default function AccountsPage() {
  const { user, error: sessionError } = useSession();
  const roleId = user?.role ?? "user";
  const allowed = canManageAccounts(roleId);
  const { users, loading, error, reload } = useUsers(!!user && allowed);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<
    null | (typeof users)[number]
  >(null);
  const [deleting, setDeleting] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter((account) =>
      [account.name, account.email, account.role]
        .filter(Boolean)
        .some(
          (value) =>
            typeof value === "string" &&
            value.toLowerCase().includes(normalizedQuery),
        ),
    );
  }, [query, users]);

  async function handleDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.id === user?.id) {
      toast.error("Akun yang sedang digunakan tidak dapat dihapus.");
      setPendingDelete(null);
      return;
    }
    setDeleting(true);
    try {
      await deleteUser(pendingDelete.id);
      toast.success("Akun berhasil dihapus.");
      setPendingDelete(null);
      reload();
    } catch (requestError) {
      toast.error(
        presentApiError(requestError, "Akun tidak dapat dihapus.").message,
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!user) {
    return (
      <AppShell active="accounts" roleId={roleId} user={user}>
        {sessionError ? (
          <ErrorNotice
            error={sessionError}
            onRetry={() => window.location.reload()}
          />
        ) : (
          <DashboardSkeleton />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell active="accounts" roleId={roleId} user={user}>
      <div className="mx-auto w-full max-w-6xl min-w-0">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Manajemen akun
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Kelola akun dan peran pengguna COLABORA.
            </p>
          </div>
          {allowed ? (
            <Button asChild className="min-h-11 w-full sm:w-auto">
              <Link href="/admin/akun/baru">
                <FilePlus2 aria-hidden="true" />
                Buat akun
              </Link>
            </Button>
          ) : null}
        </header>

        {!allowed ? (
          <section
            className="bg-card mt-6 rounded-lg px-5 py-4"
            aria-labelledby="account-access-title"
          >
            <h2
              id="account-access-title"
              className="font-display font-semibold"
            >
              Akses terbatas
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Halaman ini hanya dapat diakses oleh Admin dan Super User.
            </p>
          </section>
        ) : loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="mt-6">
            <ErrorNotice error={error} onRetry={reload} retrying={loading} />
          </div>
        ) : (
          <Card className="mt-6 rounded-lg">
            <CardContent className="p-0">
              <div className="border-b p-4 sm:p-5">
                <div className="relative w-full max-w-md">
                  <Search
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nama, email, atau role"
                    aria-label="Cari akun"
                    className="h-11 pl-9"
                  />
                </div>
              </div>
              {filteredUsers.length === 0 ? (
                <p className="text-muted-foreground p-5 text-sm">
                  Tidak ada akun yang sesuai pencarian.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[40rem] text-left text-sm">
                    <thead className="bg-muted/60 text-muted-foreground border-b">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium sm:px-5"
                        >
                          Nama
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium sm:px-5"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium sm:px-5"
                        >
                          Peran
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium sm:px-5"
                        >
                          Verifikasi
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 font-medium sm:px-5"
                        >
                          <span className="sr-only">Aksi</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredUsers.map((account) => {
                        const role = getRole(account.role);
                        return (
                          <tr key={account.id} className="hover:bg-muted/30">
                            <td className="max-w-56 truncate px-4 py-4 font-medium sm:px-5">
                              {account.name}
                            </td>
                            <td className="text-muted-foreground max-w-64 truncate px-4 py-4 sm:px-5">
                              {account.email}
                            </td>
                            <td className="px-4 py-4 sm:px-5">
                              <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs font-medium">
                                {role.label}
                              </span>
                            </td>
                            <td className="px-4 py-4 sm:px-5">
                              {account.is_verified ? (
                                <span className="text-success inline-flex items-center gap-1.5">
                                  <CheckCircle2
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  Terverifikasi
                                </span>
                              ) : (
                                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                                  <XCircle
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  Belum diverifikasi
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right sm:px-5">
                              <Button
                                type="button"
                                variant="outline"
                                className="text-destructive hover:text-destructive min-h-10"
                                onClick={() => setPendingDelete(account)}
                                disabled={account.id === user.id}
                                title={
                                  account.id === user.id
                                    ? "Akun yang sedang digunakan tidak dapat dihapus"
                                    : "Hapus akun"
                                }
                              >
                                <Trash2 aria-hidden="true" />
                                Hapus
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun {pendingDelete?.name ?? "ini"} akan dihapus dan tidak dapat
              digunakan untuk masuk kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleting ? "Menghapus..." : "Hapus akun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
