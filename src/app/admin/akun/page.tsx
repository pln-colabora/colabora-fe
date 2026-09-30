"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  CheckCircle2,
  ExternalLink,
  FilePlus2,
  LoaderCircle,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/use-session";
import { useUsers } from "@/hooks/use-users";
import { getAccountRoles, verifyUserAccount } from "@/lib/auth";
import { presentApiError } from "@/lib/error-utils";
import {
  deleteUser,
  getAccountDocument,
  updateUserUnit,
} from "@/lib/users";
import { getRole, type RoleId } from "@/lib/workflow";

const ulpUnits = ["ULP Karang Pilang", "ULP Taman", "ULP Menganti"];
const ulpRoles: RoleId[] = ["teknik", "pelayanan-pelanggan"];
const up3Roles: RoleId[] = [
  "nps",
  "perencanaan",
  "konstruksi",
  "transaksi-energi",
  "jaringan",
  "pdkb",
];

function getUnitOptions(role: RoleId | "") {
  if (!role || role.startsWith("vendor-") || ["admin", "user", "super-user"].includes(role))
    return ["-"];
  if (ulpRoles.includes(role)) return ulpUnits;
  if (up3Roles.includes(role)) return ["UP3"];
  return [];
}

function getDocumentType(url: string, mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  try {
    const pathname = new URL(
      url,
      "https://colabora.invalid",
    ).pathname.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|avif)$/.test(pathname)) return "image";
    if (pathname.endsWith(".pdf")) return "pdf";
  } catch {
    return "unknown";
  }
  return "unknown";
}

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
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<RoleId[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<unknown>(null);
  const [rolesReload, setRolesReload] = useState(0);
  const [pendingVerification, setPendingVerification] = useState<
    (typeof users)[number] | null
  >(null);
  const [verificationRole, setVerificationRole] = useState<RoleId | "">("");
  const [verificationUnit, setVerificationUnit] = useState("");
  const [verificationError, setVerificationError] = useState<unknown>(null);
  const [documentPreview, setDocumentPreview] = useState<{
    url: string;
    mimeType: string;
  } | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState<unknown>(null);
  const [documentReload, setDocumentReload] = useState(0);
  const managerId = user?.id;

  useEffect(() => {
    if (!managerId || !allowed) return;

    let active = true;
    setRolesLoading(true);
    setRolesError(null);

    getAccountRoles()
      .then((roles) => {
        if (active) setAvailableRoles(roles);
      })
      .catch((requestError) => {
        if (active) setRolesError(requestError);
      })
      .finally(() => {
        if (active) setRolesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [allowed, managerId, rolesReload]);

  useEffect(() => {
    const documentPath = pendingVerification?.account_document_url;
    if (!documentPath) {
      setDocumentPreview(null);
      setDocumentLoading(false);
      setDocumentError(null);
      return;
    }

    let active = true;
    let objectUrl: string | undefined;
    setDocumentPreview(null);
    setDocumentLoading(true);
    setDocumentError(null);

    getAccountDocument(documentPath)
      .then((blob) => {
        const previewUrl = URL.createObjectURL(blob);
        if (active) {
          objectUrl = previewUrl;
          setDocumentPreview({ url: previewUrl, mimeType: blob.type });
        } else {
          URL.revokeObjectURL(previewUrl);
        }
      })
      .catch((requestError: unknown) => {
        if (active) setDocumentError(requestError);
      })
      .finally(() => {
        if (active) setDocumentLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pendingVerification?.account_document_url, documentReload]);

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

  async function handleVerify(
    account: (typeof users)[number],
    role: RoleId,
    unit: string,
  ) {
    setVerifyingId(account.id);
    setVerificationError(null);
    try {
      await updateUserUnit(account.id, unit);
      await verifyUserAccount(account.id, role);
      toast.success(`${account.name} berhasil diverifikasi.`);
      setPendingVerification(null);
      setVerificationRole("");
      setVerificationUnit("");
      reload();
    } catch (requestError) {
      setVerificationError(requestError);
      toast.error(
        presentApiError(
          requestError,
          "Akun tidak dapat diverifikasi.",
        ).message,
      );
    } finally {
      setVerifyingId(null);
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
              {rolesError ? (
                <div className="border-b p-4 sm:p-5">
                  <ErrorNotice
                    error={rolesError}
                    fallback="Daftar peran tidak dapat dimuat."
                    onRetry={() => setRolesReload((current) => current + 1)}
                    retrying={rolesLoading}
                  />
                </div>
              ) : null}
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
                <div
                  className="overflow-x-auto"
                  role="region"
                  aria-label="Daftar akun"
                  aria-describedby="account-table-hint"
                  tabIndex={0}
                >
                  <p
                    id="account-table-hint"
                    className="text-muted-foreground px-4 pt-3 text-xs sm:hidden"
                  >
                    Geser tabel ke samping untuk melihat semua kolom.
                  </p>
                  <table className="w-full min-w-[52rem] text-left text-sm">
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
                              <div className="flex justify-end gap-2">
                                {account.is_verified === false ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="min-h-10"
                                    onClick={() => {
                                      setPendingVerification(account);
                                      setVerificationRole("");
                                      setVerificationUnit("");
                                      setVerificationError(null);
                                    }}
                                    disabled={
                                      !!verifyingId ||
                                      rolesLoading ||
                                      !!rolesError
                                    }
                                  >
                                    <CheckCircle2 aria-hidden="true" />
                                    Verifikasi
                                  </Button>
                                ) : null}
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
                              </div>
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
      <AlertDialog
        open={!!pendingVerification}
        onOpenChange={(open) => {
          if (!open && !verifyingId) {
            setPendingVerification(null);
            setVerificationRole("");
            setVerificationUnit("");
            setVerificationError(null);
          }
        }}
      >
        <AlertDialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Verifikasi akun</AlertDialogTitle>
            <AlertDialogDescription>
              Tinjau dokumen pendaftaran, lalu pilih role dan unit untuk{" "}
              {pendingVerification?.name ?? "akun ini"} sebelum akun diaktifkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <section
            aria-labelledby="verification-document-title"
            className="space-y-2"
          >
            <h3
              id="verification-document-title"
              className="text-sm font-medium"
            >
              Dokumen pendaftaran
            </h3>
            {pendingVerification?.account_document_url ? (
              <div className="bg-muted/20 overflow-hidden rounded-md border">
                {documentLoading ? (
                  <p role="status" className="text-muted-foreground p-4 text-sm">
                    Memuat dokumen pendaftaran...
                  </p>
                ) : documentError ? (
                  <div className="flex items-center justify-between gap-4 p-4">
                    <p role="alert" className="text-destructive text-sm">
                      {presentApiError(
                        documentError,
                        "Dokumen pendaftaran gagal dimuat.",
                      ).message}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDocumentReload((value) => value + 1)}
                    >
                      Coba lagi
                    </Button>
                  </div>
                ) : documentPreview &&
                  getDocumentType(
                    pendingVerification.account_document_url,
                    documentPreview.mimeType,
                  ) === "image" ? (
                  <Image
                    src={documentPreview.url}
                    alt={`Dokumen pendaftaran ${pendingVerification.name}`}
                    width={1200}
                    height={800}
                    unoptimized
                    className="mx-auto max-h-[40vh] w-full object-contain"
                  />
                ) : documentPreview &&
                  getDocumentType(
                    pendingVerification.account_document_url,
                    documentPreview.mimeType,
                  ) === "pdf" ? (
                  <iframe
                    src={documentPreview.url}
                    title={`Dokumen pendaftaran ${pendingVerification.name}`}
                    className="h-[40vh] w-full"
                    referrerPolicy="no-referrer"
                  />
                ) : documentPreview ? (
                  <p className="text-muted-foreground p-4 text-sm">
                    Pratinjau tidak tersedia untuk format dokumen ini.
                  </p>
                ) : (
                  <p role="status" className="text-muted-foreground p-4 text-sm">
                    Menyiapkan pratinjau dokumen...
                  </p>
                )}
                {documentPreview && !documentError ? (
                  <div className="border-t p-3">
                    <a
                      href={documentPreview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary focus-visible:ring-ring inline-flex min-h-10 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                    >
                      Buka dokumen di tab baru
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground rounded-md border p-4 text-sm">
                Dokumen pendaftaran tidak tersedia untuk akun ini.
              </p>
            )}
          </section>
          {verificationError ? (
            <p role="alert" className="text-destructive text-sm">
              {presentApiError(
                verificationError,
                "Akun tidak dapat diverifikasi.",
              ).message}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <label
                htmlFor="verification-role"
                className="text-sm font-medium"
              >
                Role
              </label>
              <Select
                value={verificationRole}
                onValueChange={(value) => {
                  setVerificationRole(value as RoleId);
                  setVerificationUnit("");
                  setVerificationError(null);
                }}
                disabled={!!verifyingId || rolesLoading || !!rolesError}
              >
                <SelectTrigger id="verification-role" className="h-11 w-full">
                  <SelectValue
                    placeholder={rolesLoading ? "Memuat role..." : "Pilih role"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {getRole(role).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <label
                htmlFor="verification-unit"
                className="text-sm font-medium"
              >
                Unit
              </label>
              <Select
                value={verificationUnit}
                onValueChange={(unit) => {
                  setVerificationUnit(unit);
                  setVerificationError(null);
                }}
                disabled={!verificationRole || !!verifyingId}
              >
                <SelectTrigger id="verification-unit" className="h-11 w-full">
                  <SelectValue
                    placeholder={
                      verificationRole ? "Pilih unit" : "Pilih role dahulu"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {getUnitOptions(verificationRole).map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit === "-" ? "- (tanpa unit)" : unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!verifyingId}>Batal</AlertDialogCancel>
            <Button
              type="button"
              onClick={() => {
                if (
                  pendingVerification &&
                  availableRoles.includes(verificationRole as RoleId) &&
                  getUnitOptions(verificationRole).includes(verificationUnit)
                )
                  void handleVerify(
                    pendingVerification,
                    verificationRole as RoleId,
                    verificationUnit,
                  );
              }}
              disabled={
                !!verifyingId ||
                rolesLoading ||
                !!rolesError ||
                !verificationRole ||
                !availableRoles.includes(verificationRole as RoleId) ||
                !getUnitOptions(verificationRole).includes(verificationUnit)
              }
            >
              {verifyingId ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : null}
              {verifyingId ? "Memverifikasi..." : "Verifikasi akun"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
