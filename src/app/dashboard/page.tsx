"use client";

import { Suspense, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ArrowRight,
  Clock3,
  FilePlus2,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  AppShell,
  canCreatePermohonan,
} from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { DashboardSkeleton } from "@/components/dashboard/page-skeletons";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications } from "@/hooks/use-applications";
import { useSession } from "@/hooks/use-session";
import { formatApiDate } from "@/lib/utils";
import {
  getActivity,
  getApplicationStatus,
  getCurrentStage,
  getOwner,
  getRole,
  stages,
  type Application,
} from "@/lib/workflow";

type View = "all" | "mine";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <DashboardSkeleton />
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isHome = !searchParams.has("view");
  const view: View = searchParams.get("view") === "mine" ? "mine" : "all";
  const urlQuery = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const { user, error: sessionError } = useSession();
  const roleId = user?.role ?? "user";
  const {
    applications,
    loading: applicationsLoading,
    error: loadError,
    reload,
  } = useApplications(!!user);
  const ready = !applicationsLoading;

  // Keep local search in sync if URL query changes from navigation or back/forward
  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  // Debounce syncing local search to URL query parameter to avoid blocking typing
  useEffect(() => {
    if (searchQuery.trim() === urlQuery.trim()) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      } else {
        params.delete("q");
      }
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, urlQuery, searchParams, router]);

  function handleStatusChange(value: string) {
    const nextStatus = value === "all" ? "" : value;
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }
    if (nextStatus) {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  }

  function handleResetFilters() {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("status");
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  }

  function dashboardHref(nextView: View) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    return `/dashboard?${params.toString()}`;
  }

  const returnTo = `/dashboard?${searchParams.toString()}`;

  const roleQueue = applications.filter(isOwnedBy);
  const search = searchQuery.trim().toLocaleLowerCase("id-ID");
  const searchTerms = search.split(/\s+/).filter(Boolean);

  const filteredApplications = (
    view === "mine" ? roleQueue : applications
  ).filter((application) => {
    if (statusFilter && getApplicationStatus(application) !== statusFilter) {
      return false;
    }
    if (searchTerms.length === 0) {
      return true;
    }
    const activity = getActivity(application.currentAction);
    const stage = stages.find(
      (item) => item.id === getCurrentStage(application),
    );
    const haystack = [
      application.number,
      application.id,
      application.customer,
      application.unit,
      application.phone,
      application.location,
      application.requestType,
      application.connectionType,
      stage?.label,
      stage?.shortLabel,
      activity?.label,
      activity?.shortLabel,
      getApplicationStatus(application),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("id-ID");

    return searchTerms.every((term) => haystack.includes(term));
  });

  const role = getRole(roleId);
  const visibleApplications = isHome && !search && !statusFilter
    ? [...applications]
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
        .slice(0, 5)
    : filteredApplications;
  const completedCount = applications.filter(
    (item) => getApplicationStatus(item) === "Selesai",
  ).length;
  const activeCount = applications.filter(
    (item) => item.status === "in_progress",
  ).length;
  const overdueCount = applications.filter(
    (item) => item.sla.tone === "late" && item.status === "in_progress",
  ).length;
  const showProcessDistribution =
    !isHome && ready && (roleId === "admin" || roleId === "super-user");

  return (
    <AppShell
      active={isHome ? "dashboard" : "applications"}
      roleId={roleId}
      user={user}
    >
      <div className="w-full max-w-full min-w-0 overflow-x-clip">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {isHome ? "Beranda" : "Permohonan"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isHome ? (
                <>
                  Selamat datang,{" "}
                  <strong className="text-foreground font-semibold">
                    {user?.name ?? "..."}
                  </strong>
                  .
                </>
              ) : (
                "Cari permohonan dan lanjutkan pekerjaan sesuai peran Anda."
              )}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            {ready && canCreatePermohonan(roleId) ? (
              <Button asChild className="min-h-11 w-full sm:w-auto">
                <Link
                  href={`/permohonan/baru?returnTo=${encodeURIComponent(returnTo)}`}
                >
                  <FilePlus2 aria-hidden="true" />
                  Permohonan baru
                </Link>
              </Button>
            ) : null}
            <p className="text-muted-foreground text-sm">
              Data backend COLABORA
            </p>
          </div>
        </header>

        {Boolean(loadError || sessionError) && (
          <div className="text-destructive mt-4">
            <ErrorNotice
              error={loadError ?? sessionError}
              onRetry={() => (sessionError ? window.location.reload() : reload())}
              retrying={applicationsLoading}
            />
          </div>
        )}
        {isHome && (
          <>
            <p className="text-muted-foreground mt-2 text-sm">
              {role.lane} /{" "}
              {roleId === "super-user"
                ? "Pemantauan tanpa mengubah aktivitas"
                : "Permohonan PB/PD"}
            </p>
            <section
              aria-label="Ringkasan seluruh permohonan"
              className="mt-6 grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4"
            >
              <SummaryMetric
                tone="primary"
                label="Total permohonan"
                value={applications.length}
                detail="Seluruh permohonan yang dapat diakses"
                ready={ready}
              />
              <SummaryMetric
                tone="warning"
                label="Dalam proses"
                value={activeCount}
                detail="Belum selesai atau ditolak"
                ready={ready}
              />
              <SummaryMetric
                tone="success"
                label="Selesai"
                value={completedCount}
                detail="Proses telah ditutup"
                ready={ready}
              />
              <SummaryMetric
                label="SLA terlambat"
                value={overdueCount}
                detail="Memerlukan perhatian"
                danger
                ready={ready}
              />
            </section>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                {roleId === "super-user" ? (
                  "Pantau progres seluruh permohonan PB/PD."
                ) : (
                  <>
                    <strong className="text-foreground font-semibold">
                      {ready ? roleQueue.length : "..."} permohonan
                    </strong>{" "}
                    menunggu tindakan peran Anda.
                  </>
                )}
              </p>
              <Button asChild className="min-h-11 w-full sm:w-auto">
                  <Link href={dashboardHref("mine")}>
                  {roleId === "super-user"
                    ? "Lihat permohonan dalam pemantauan"
                    : "Lihat tugas saya"}{" "}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </>
        )}

        {showProcessDistribution && (
          <section
            className="bg-card mt-6 overflow-hidden rounded-lg"
            aria-labelledby="distribution-title"
          >
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3.5">
              <h2
                id="distribution-title"
                className="font-display text-base font-semibold"
              >
                Posisi proses aktif
              </h2>
              <span className="text-muted-foreground text-sm">
                {stages.length} tahap utama
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
              {stages.map((stage) => {
                const count = applications.filter(
                  (application) =>
                    application.status === "in_progress" &&
                    application.currentStage === stage.id,
                ).length;
                return (
                  <div
                    key={stage.id}
                    className="border-r border-b px-4 py-3.5 last:border-r-0 xl:border-b-0 sm:[&:nth-child(4n)]:border-r-0 xl:[&:nth-child(4n)]:border-r xl:[&:nth-child(7n)]:border-r-0"
                  >
                    <p className="text-muted-foreground text-xs font-medium">
                      Tahap {stage.id}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {count}
                    </p>
                    <p className="mt-1 text-sm leading-5">{stage.shortLabel}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section
          className="bg-card mt-6 min-w-0 overflow-hidden rounded-lg"
          aria-labelledby="applications-title"
          aria-busy={!ready}
        >
          <div
            className={
              isHome
                ? "flex items-center justify-between gap-4 border-b p-4 lg:px-5"
                : "flex flex-col gap-4 border-b p-4 lg:p-5"
            }
          >
            <div>
              <h2
                id="applications-title"
                className="font-display text-lg font-semibold"
              >
                {isHome ? "Permohonan terbaru" : "Daftar permohonan"}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {ready
                  ? `${visibleApplications.length} permohonan ditampilkan`
                  : "Menyiapkan daftar permohonan"}
              </p>
            </div>
            {isHome ? (
              <Link
                href={dashboardHref("all")}
                className="text-primary inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium hover:underline"
              >
                Lihat semua <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div
                  className="bg-muted grid w-full grid-cols-2 rounded-md p-1 sm:flex sm:w-auto"
                  role="group"
                  aria-label="Jenis daftar"
                >
                  <Link
                    href={dashboardHref("all")}
                    aria-current={view === "all" ? "page" : undefined}
                    className={`flex min-h-11 min-w-0 items-center justify-center rounded px-3 text-sm font-medium ${view === "all" ? "bg-card text-primary" : "text-muted-foreground"}`}
                  >
                    Semua permohonan
                  </Link>
                  <Link
                    href={dashboardHref("mine")}
                    aria-current={view === "mine" ? "page" : undefined}
                    className={`flex min-h-11 min-w-0 items-center justify-center rounded px-3 text-sm font-medium ${view === "mine" ? "bg-card text-primary" : "text-muted-foreground"}`}
                  >
                    {roleId === "super-user"
                      ? "Dalam pemantauan"
                      : "Tugas saya"}
                    {` (${roleQueue.length})`}
                  </Link>
                </div>
                <div className="relative sm:ml-auto sm:min-w-64 sm:flex-1 lg:max-w-sm">
                  <Search
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari nomor, pelanggan, atau unit"
                    aria-label="Cari permohonan"
                    className="h-11 pl-9 pr-9"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 focus-visible:outline-2"
                      aria-label="Hapus pencarian"
                      title="Hapus pencarian"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="status-filter" className="text-sm">
                    Status
                  </label>
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger
                      id="status-filter"
                      className="bg-card h-11 w-44"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua status</SelectItem>
                      {Array.from(
                        new Set(applications.map(getApplicationStatus)),
                      ).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(searchQuery || statusFilter) && (
                    <Button
                      variant="ghost"
                      className="min-h-11"
                      onClick={handleResetFilters}
                    >
                      Reset filter
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {!ready ? (
            <div role="status" aria-busy="true" className="space-y-3 p-5">
              <p className="text-muted-foreground text-sm">
                {loadError || sessionError
                  ? "Data permohonan belum tersedia."
                  : "Memuat permohonan..."}
              </p>
              {!loadError &&
                !sessionError &&
                [1, 2, 3].map((row) => (
                  <Skeleton
                    key={row}
                    className="h-16 w-full"
                  />
                ))}
            </div>
          ) : visibleApplications.length > 0 ? (
            <>
              <div className="divide-y px-4 lg:hidden">
                {visibleApplications.map((application) => (
                    <ApplicationListItem
                      key={application.id}
                      application={application}
                      returnTo={returnTo}
                  />
                ))}
              </div>
              <div
                className="focus-visible:ring-ring hidden w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-b-lg focus-visible:ring-2 focus-visible:ring-inset lg:block"
                role="region"
                aria-label="Tabel permohonan"
                tabIndex={0}
              >
                <table
                  className={`w-full table-auto border-collapse text-sm ${isHome ? "min-w-[960px]" : "min-w-[1360px]"}`}
                >
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr className="border-b text-left text-sm">
                      <th className="px-4 py-3 font-medium">
                        Nomor permohonan
                      </th>
                      <th className="px-4 py-3 font-medium">Pelanggan</th>
                      {!isHome && (
                        <th className="px-4 py-3 font-medium">Unit</th>
                      )}
                      <th className="px-4 py-3 font-medium">Tahap saat ini</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      {!isHome && (
                        <th className="px-4 py-3 font-medium">PIC</th>
                      )}
                      {isHome && (
                        <th className="px-4 py-3 font-medium">Tanggal</th>
                      )}
                      <th className="px-4 py-3 font-medium">SLA</th>
                      <th className="px-4 py-3">
                        <span className="sr-only">Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleApplications.map((application) => (
                      <ApplicationRow
                        compact={isHome}
                        key={application.id}
                        application={application}
                        returnTo={returnTo}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="px-5 py-8">
              <p className="font-medium">
                {applications.length === 0
                  ? "Belum ada permohonan"
                  : "Tidak ada permohonan yang sesuai"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {applications.length === 0
                  ? "Belum ada permohonan yang dapat diakses akun ini."
                  : "Ubah pencarian, reset filter, atau pilih Semua permohonan."}
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ApplicationListItem({
  application,
  returnTo,
}: {
  application: Application;
  returnTo: string;
}) {
  const activity = getActivity(application.currentAction);
  const stage = stages.find(
    (item) => item.id === getCurrentStage(application),
  )!;
  const owner = activity ? getRole(getOwner(activity, application)) : null;
  const owned = isOwnedBy(application);

  return (
    <article className="min-w-0 py-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{application.customer}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {application.requestType} / {application.unit}
          </p>
          <p className="text-muted-foreground mt-1 truncate font-mono text-sm">
            {application.number}
          </p>
        </div>
        <StatusBadge status={getApplicationStatus(application)} />
      </div>

      <dl className="mt-3 grid min-w-0 grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-muted-foreground text-sm">Tahap saat ini</dt>
          <dd className="mt-1 truncate">
            {application.rejected ? "Delegasi PK NPS" : stage.shortLabel}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground text-sm">PIC</dt>
          <dd className="mt-1 truncate">
            {application.rejected || !owner ? "—" : owner.label}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground text-sm">SLA</dt>
          <dd className="mt-1">
            <SlaIndicator application={application} />
          </dd>
        </div>
      </dl>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <time
          dateTime={application.requestedAt || undefined}
          className="text-muted-foreground text-sm"
        >
          {formatApiDate(application.requestedAt, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
        <Link
          href={`/permohonan/${application.id}?returnTo=${encodeURIComponent(returnTo)}`}
          className="text-primary inline-flex min-h-11 items-center gap-1 text-sm font-medium whitespace-nowrap hover:underline"
        >
          {owned ? "Lanjutkan" : "Lihat detail"}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
  danger = false,
  ready,
  tone = "default",
}: {
  label: string;
  value: number;
  detail: string;
  danger?: boolean;
  ready: boolean;
  tone?: "default" | "primary" | "warning" | "success";
}) {
  const valueColor =
    danger && value > 0
      ? "text-destructive"
      : tone === "primary"
        ? "text-primary"
        : tone === "warning"
          ? "text-warning"
          : tone === "success"
            ? "text-success"
            : "text-foreground";
  return (
    <div className="bg-card rounded-lg px-4 py-4 lg:px-5 lg:py-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-foreground text-sm font-medium">{label}</p>
        {danger && value > 0 ? (
          <TriangleAlert
            className="text-destructive size-4"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueColor}`}>
        {ready ? value.toLocaleString("id-ID") : "—"}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">{detail}</p>
    </div>
  );
}

function ApplicationRow({
  application,
  compact = false,
  returnTo,
}: {
  application: Application;
  compact?: boolean;
  returnTo: string;
}) {
  const activity = getActivity(application.currentAction);
  const stage = stages.find(
    (item) => item.id === getCurrentStage(application),
  )!;
  const owner = activity ? getRole(getOwner(activity, application)) : null;
  const owned = isOwnedBy(application);
  const status = getApplicationStatus(application);

  return (
    <tr className="hover:bg-muted/35 border-b transition-colors duration-150 last:border-b-0">
      <td className="px-4 py-3 font-mono text-sm font-medium whitespace-nowrap">
        {application.number}
      </td>
      <td className="px-4 py-3">
        <p className="max-w-48 truncate font-medium">{application.customer}</p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {application.requestType}
          {compact ? ` / ${application.unit}` : ""}
        </p>
      </td>
      {!compact && (
        <td className="px-4 py-3 whitespace-nowrap">{application.unit}</td>
      )}
      <td className="px-4 py-3">
        <p className="max-w-44 truncate">
          {application.rejected ? "Delegasi PK NPS" : stage.shortLabel}
        </p>
        {activity && !application.rejected ? (
          <p className="text-muted-foreground mt-0.5 max-w-44 truncate text-sm">
            {activity.shortLabel}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={status} />
      </td>
      {!compact && (
        <td className="px-4 py-3">
          <p className="max-w-40 truncate">
            {application.rejected || !owner ? "—" : owner.label}
          </p>
          {owner && !application.rejected ? (
            <p className="text-muted-foreground mt-0.5 text-sm">{owner.lane}</p>
          ) : null}
        </td>
      )}
      {compact && (
        <td className="px-4 py-3 whitespace-nowrap">
          <time dateTime={application.requestedAt || undefined}>
            {formatApiDate(application.requestedAt, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
        </td>
      )}
      <td className="px-4 py-3">
        <SlaIndicator application={application} />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/permohonan/${application.id}?returnTo=${encodeURIComponent(returnTo)}`}
          className="text-primary inline-flex min-h-11 items-center gap-1 text-sm font-medium whitespace-nowrap hover:underline"
        >
          {owned ? "Lanjutkan" : "Lihat"}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </td>
    </tr>
  );
}

function SlaIndicator({ application }: { application: Application }) {
  const color =
    application.sla.tone === "late"
      ? "text-destructive"
      : application.sla.tone === "due"
        ? "text-warning"
        : application.sla.tone === "done"
          ? "text-success"
          : "text-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap ${color}`}
    >
      <Clock3 className="size-3.5" aria-hidden="true" />
      {application.sla.label}
    </span>
  );
}

function isOwnedBy(application: Application) {
  return application.availableActions.length > 0;
}
