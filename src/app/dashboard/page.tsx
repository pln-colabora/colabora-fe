"use client";

import { Suspense, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Archive,
  ArrowRight,
  Calculator,
  CircleCheck,
  ClipboardCheck,
  Construction,
  Clock3,
  FileText,
  FilePlus2,
  ListTodo,
  MapPin,
  Search,
  TriangleAlert,
  UserRound,
  Zap,
  X,
} from "lucide-react";

import {
  AppShell,
  canCreatePermohonan,
} from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { DashboardSkeleton } from "@/components/dashboard/page-skeletons";
import { StatusBadge } from "@/components/dashboard/status-badge";
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
import {
  formatApiDate,
  formatSlaRemaining,
  getSlaDaysRemaining,
} from "@/lib/utils";
import {
  getActivity,
  getApplicationStatus,
  getCurrentStage,
  getOwnedSla,
  getOwner,
  getRole,
  stages,
  type Application,
} from "@/lib/workflow";

type View = "all" | "mine";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
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
  const stageFilter = searchParams.get("stage") ?? "";
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
    params.delete("stage");
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

  const sourceApplications = view === "mine" ? roleQueue : applications;
  const filteredApplications = sourceApplications.filter((application) => {
    if (stageFilter && String(getCurrentStage(application)) !== stageFilter) {
      return false;
    }
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
  const visibleApplications =
    isHome && !search && !statusFilter && !stageFilter
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
    (item) => item.sla.tone === "late",
  ).length;
  const showKanban =
    isHome && ready && (roleId === "admin" || roleId === "super-user");

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
          </div>
        </header>

        {Boolean(loadError || sessionError) && (
          <div className="text-destructive mt-4">
            <ErrorNotice
              error={loadError ?? sessionError}
              onRetry={() =>
                sessionError ? window.location.reload() : reload()
              }
              retrying={applicationsLoading}
            />
          </div>
        )}
        <WelcomeDialog
          active={isHome && ready && !loadError && !!user}
          user={user}
          roleId={roleId}
          roleQueue={roleQueue}
          taskHref={dashboardHref("mine")}
          totalCount={applications.length}
          activeCount={activeCount}
          completedCount={completedCount}
          overdueCount={overdueCount}
        />
        {isHome && (
          <>
            <p className="text-muted-foreground mt-2 text-sm">
              {role.lane} /{" "}
              {roleId === "super-user"
                ? "Pemantauan tanpa mengubah aktivitas"
                : "Permohonan PB/PD"}
            </p>
            {roleId !== "admin" && roleId !== "super-user" ? (
              <section
                className="bg-card mt-5 rounded-lg border p-4 sm:p-5"
                aria-labelledby="my-work-title"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <h2
                      id="my-work-title"
                      className="font-display text-lg font-semibold"
                    >
                      Tugas saya
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {ready
                        ? `${roleQueue.length} permohonan menunggu tindakan peran Anda`
                        : "Memuat tugas..."}
                    </p>
                  </div>
                  <Button asChild variant="outline" className="min-h-11">
                    <Link href={dashboardHref("mine")}>
                      Lihat semua tugas <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
                {ready && roleQueue.length ? (
                  <ol className="divide-y">
                    {[...roleQueue]
                      .map((application) => ({
                        application,
                        sla:
                          getOwnedSla(application, roleId) ?? application.sla,
                      }))
                      .sort((a, b) => {
                        const aDeadline = a.sla.deadline ?? "9999";
                        const bDeadline = b.sla.deadline ?? "9999";
                        return aDeadline.localeCompare(bDeadline);
                      })
                      .slice(0, 3)
                      .map(({ application, sla }) => (
                        <li key={application.id}>
                          <Link
                            href={`/permohonan/${application.id}?returnTo=${encodeURIComponent(`/dashboard?${searchParams.toString()}`)}`}
                            className="hover:bg-muted/30 flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {application.customer}
                              </span>
                              <span className="text-muted-foreground mt-0.5 block font-mono text-xs">
                                {application.number} ·{" "}
                                {getActivity(application.currentAction)
                                  ?.shortLabel ?? "Lanjutkan permohonan"}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-3 text-sm">
                              <SlaIndicator
                                application={application}
                                sla={sla}
                              />
                              <ArrowRight
                                className="text-primary size-4"
                                aria-hidden="true"
                              />
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ol>
                ) : ready ? (
                  <p className="text-muted-foreground py-4 text-sm">
                    Belum ada tugas yang menunggu tindakan Anda.
                  </p>
                ) : (
                  <div role="status" className="space-y-2 pt-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                )}
              </section>
            ) : null}
            <section
              aria-label="Ringkasan seluruh permohonan"
              className="mt-6 grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4"
            >
              <SummaryMetric
                tone="primary"
                label="Total permohonan"
                value={applications.length}
                ready={ready}
              />
              <SummaryMetric
                tone="warning"
                label="Dalam proses"
                value={activeCount}
                ready={ready}
              />
              <SummaryMetric
                tone="success"
                label="Selesai"
                value={completedCount}
                ready={ready}
              />
              <SummaryMetric
                label="Over SLA"
                value={overdueCount}
                danger
                ready={ready}
              />
            </section>
          </>
        )}

        {showKanban && (
          <section className="mt-6" aria-labelledby="process-board-title">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="process-board-title"
                  className="font-display text-lg font-semibold"
                >
                  Permohonan per tahap
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Pantau posisi proses dan SLA tanpa membuka setiap detail.
                </p>
              </div>
              <Link
                href={dashboardHref("all")}
                className="text-primary inline-flex min-h-11 items-center gap-2 text-sm font-medium hover:underline"
              >
                Buka daftar <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div
              className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6"
              role="region"
              aria-label="Papan proses permohonan"
              tabIndex={0}
            >
              <div className="grid min-w-max auto-cols-[minmax(260px,300px)] grid-flow-col gap-3">
                {stages.map((stage) => {
                  const StageIcon = [
                    FilePlus2,
                    MapPin,
                    Calculator,
                    ClipboardCheck,
                    Construction,
                    Zap,
                    Archive,
                  ][stage.id - 1];
                  const items = applications.filter(
                    (application) =>
                      application.status === "in_progress" &&
                      getCurrentStage(application) === stage.id,
                  );
                  const late = items.filter(
                    (application) => application.sla.tone === "late",
                  ).length;
                  return (
                    <section
                      key={stage.id}
                      className="bg-muted/55 rounded-lg border p-3"
                      aria-label={`Tahap ${stage.id}: ${stage.label}`}
                    >
                      <header className="border-border/80 flex items-center justify-between gap-3 border-b pb-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <StageIcon
                            className="text-primary size-[1.125rem] shrink-0"
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-xs font-medium">
                              Tahap {stage.id}
                            </p>
                            <h3 className="mt-0.5 truncate text-sm font-semibold">
                              {stage.shortLabel}
                            </h3>
                          </div>
                        </div>
                        <span
                          className="bg-background inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums"
                          aria-label={`${items.length} permohonan`}
                        >
                          {items.length}
                        </span>
                      </header>
                      {late > 0 && (
                        <p className="text-destructive mt-2 inline-flex items-center gap-1.5 text-xs font-medium">
                          <TriangleAlert
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          {late} melewati SLA
                        </p>
                      )}
                      <div className="mt-2 space-y-2">
                        {items.length ? (
                          items.map((application) => {
                            const activity = getActivity(
                              application.currentAction,
                            );
                            const owner = activity
                              ? getRole(getOwner(activity, application))
                              : null;
                            return (
                              <Link
                                key={application.id}
                                href={`/permohonan/${application.id}?returnTo=${encodeURIComponent(`/dashboard?${searchParams.toString()}`)}`}
                                className="bg-card hover:border-primary/50 block rounded-md border p-3 transition-colors focus-visible:outline-2"
                              >
                                <span className="font-mono text-xs font-medium">
                                  {application.number}
                                </span>
                                <span className="mt-1 block truncate text-sm font-medium">
                                  {application.customer}
                                </span>
                                <span className="text-muted-foreground mt-2 flex min-w-0 items-center gap-1.5 truncate text-xs">
                                  <ListTodo
                                    className="size-3.5 shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span className="truncate">
                                    {activity?.shortLabel ?? stage.shortLabel} ·{" "}
                                    {application.unit}
                                  </span>
                                </span>
                                <span className="border-border/80 mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-dashed pt-2.5">
                                  {owner ? (
                                    <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
                                      <UserRound
                                        className="size-3.5 shrink-0"
                                        aria-hidden="true"
                                      />
                                      <span className="truncate">
                                        {owner.label}
                                      </span>
                                    </span>
                                  ) : (
                                    <span />
                                  )}
                                  <SlaIndicator
                                    application={application}
                                    compact
                                  />
                                </span>
                              </Link>
                            );
                          })
                        ) : (
                          <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm">
                            Tidak ada permohonan aktif
                          </p>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
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
                ? "flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between lg:px-5"
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
                    className="h-11 pr-9 pl-9"
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
                  {(searchQuery || statusFilter || stageFilter) && (
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

          {!isHome && (
            <nav
              aria-label="Filter tahap proses"
              className="flex gap-2 overflow-x-auto border-b px-4 py-3 lg:px-5"
            >
              <Link
                href={setDashboardStage(searchParams.toString(), "")}
                aria-current={!stageFilter ? "page" : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-md px-3 text-sm font-medium ${!stageFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                Semua tahap
              </Link>
              {stages.map((stage) => {
                const count = sourceApplications.filter(
                  (application) => getCurrentStage(application) === stage.id,
                ).length;
                return (
                  <Link
                    key={stage.id}
                    href={setDashboardStage(
                      searchParams.toString(),
                      String(stage.id),
                    )}
                    aria-current={
                      stageFilter === String(stage.id) ? "page" : undefined
                    }
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium ${stageFilter === String(stage.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {stage.shortLabel}
                    <span className="tabular-nums">{count}</span>
                  </Link>
                );
              })}
            </nav>
          )}

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
                  <Skeleton key={row} className="h-16 w-full" />
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

function WelcomeDialog({
  active,
  user,
  roleId,
  roleQueue,
  taskHref,
  totalCount,
  activeCount,
  completedCount,
  overdueCount,
}: {
  active: boolean;
  user: NonNullable<ReturnType<typeof useSession>["user"]> | null;
  roleId: ReturnType<typeof getRole>["id"];
  roleQueue: Application[];
  taskHref: string;
  totalCount: number;
  activeCount: number;
  completedCount: number;
  overdueCount: number;
}) {
  const [open, setOpen] = useState(false);
  const isMonitoring = roleId === "admin" || roleId === "super-user";
  const role = getRole(roleId);

  useEffect(() => {
    if (!active || !user) return;
    const key = `colabora:welcome:${user.id}:${user.role}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "shown");
    } catch {
      // Keep the welcome available when browser storage is restricted.
    }
    setOpen(true);
  }, [active, user]);

  const topTasks = [...roleQueue]
    .map((application) => ({
      application,
      sla: getOwnedSla(application, roleId) ?? application.sla,
    }))
    .sort((a, b) => {
      const aDeadline = a.sla.deadline ?? "9999";
      const bDeadline = b.sla.deadline ?? "9999";
      return aDeadline.localeCompare(bDeadline);
    })
    .slice(0, 3);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl gap-0 overflow-hidden border-0 p-0">
        <AlertDialogHeader className="bg-primary text-primary-foreground flex-row items-start justify-between gap-4 px-5 py-4 text-left sm:px-6">
          <div className="min-w-0">
            <p className="text-primary-foreground/80 text-xs font-medium">
              {role.label} · {role.lane}
            </p>
            <AlertDialogTitle className="text-primary-foreground mt-1 text-xl">
              Selamat datang, {user?.name}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-primary-foreground mt-1 text-sm leading-5">
              {isMonitoring
                ? "Berikut ringkasan permohonan yang dapat Anda pantau."
                : roleQueue.length
                  ? `Ada ${roleQueue.length} permohonan menunggu tindakan peran Anda.`
                  : "Saat ini tidak ada permohonan yang menunggu tindakan Anda."}
            </AlertDialogDescription>
          </div>
          <AlertDialogCancel
            aria-label="Tutup sapaan"
            className="hover:bg-primary-foreground/15 text-primary-foreground hover:text-primary-foreground -mt-1 -mr-2 size-10 shrink-0 border-0 bg-transparent p-0 shadow-none [&_svg]:size-4"
          >
            <X className="size-4" aria-hidden="true" />
          </AlertDialogCancel>
        </AlertDialogHeader>

        <div className="max-h-[calc(85dvh-10rem)] overflow-y-auto p-4 sm:p-5">
          {isMonitoring ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <WelcomeMetric label="Total" value={totalCount} icon={FileText} />
              <WelcomeMetric
                label="Dalam proses"
                value={activeCount}
                icon={Clock3}
              />
              <WelcomeMetric
                label="Selesai"
                value={completedCount}
                icon={CircleCheck}
              />
              <WelcomeMetric
                label="Over SLA"
                value={overdueCount}
                icon={TriangleAlert}
                danger={overdueCount > 0}
              />
            </div>
          ) : topTasks.length ? (
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Prioritas saat ini</h3>
                <span className="text-muted-foreground text-xs">
                  Terurut menurut tenggat
                </span>
              </div>
              <ul className="divide-y rounded-lg border">
                {topTasks.map(({ application, sla }) => (
                  <li key={application.id}>
                    <Link
                      href={`/permohonan/${application.id}?returnTo=${encodeURIComponent(taskHref)}`}
                      onClick={() => setOpen(false)}
                      className="hover:bg-muted/40 flex min-h-16 items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {application.customer}
                        </span>
                        <span className="text-muted-foreground mt-0.5 block truncate font-mono text-xs">
                          {application.number} ·{" "}
                          {getActivity(application.currentAction)?.shortLabel ??
                            "Lanjutkan permohonan"}
                        </span>
                      </span>
                      <SlaIndicator
                        application={application}
                        sla={sla}
                        compact
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-muted/50 flex items-start gap-3 rounded-lg border p-4">
              <CircleCheck
                className="text-success mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <h3 className="text-sm font-semibold">
                  Belum ada tugas untuk Anda
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Permohonan baru yang menjadi tanggung jawab peran Anda akan
                  muncul di sini.
                </p>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="bg-muted/40 border-t p-4 sm:px-5">
          <AlertDialogCancel className="min-h-11">Nanti</AlertDialogCancel>
          <AlertDialogAction asChild className="min-h-11">
            <Link
              href={
                isMonitoring
                  ? "/dashboard?view=all"
                  : roleQueue.length
                    ? taskHref
                    : "/dashboard?view=all"
              }
            >
              {isMonitoring
                ? "Buka pemantauan"
                : roleQueue.length
                  ? "Buka daftar tugas"
                  : "Lihat permohonan"}
              <ArrowRight aria-hidden="true" />
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function WelcomeMetric({
  label,
  value,
  icon: Icon,
  danger = false,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  danger?: boolean;
}) {
  return (
    <div className="bg-background rounded-lg border p-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Icon
          className={`size-3.5 ${danger ? "text-destructive" : "text-primary"}`}
          aria-hidden="true"
        />
        {label}
      </div>
      <p
        className={`mt-1.5 text-2xl font-semibold tabular-nums ${danger ? "text-destructive" : "text-foreground"}`}
      >
        {value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}

function setDashboardStage(query: string, stage: string) {
  const params = new URLSearchParams(query);
  if (stage) params.set("stage", stage);
  else params.delete("stage");
  return `/dashboard?${params.toString()}`;
}

function ApplicationListItem({
  application,
  returnTo,
}: {
  application: Application;
  returnTo: string;
}) {
  const stage = stages.find(
    (item) => item.id === getCurrentStage(application),
  )!;
  const owned = isOwnedBy(application);

  return (
    <article className="min-w-0 py-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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

      <dl className="mt-3 grid min-w-0 grid-cols-2 gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-muted-foreground text-sm">Tahap saat ini</dt>
          <dd className="mt-1 truncate">
            {application.rejected ? "Delegasi PK NPS" : stage.shortLabel}
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
  danger = false,
  ready,
  tone = "default",
}: {
  label: string;
  value: number;
  danger?: boolean;
  ready: boolean;
  tone?: "default" | "primary" | "warning" | "success";
}) {
  const Icon = danger
    ? TriangleAlert
    : tone === "success"
      ? CircleCheck
      : tone === "warning"
        ? Clock3
        : FileText;
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
        <p className="text-foreground inline-flex items-center gap-2 text-sm font-medium">
          <Icon
            className={`size-4 shrink-0 ${valueColor}`}
            aria-hidden="true"
          />
          {label}
        </p>
      </div>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueColor}`}>
        {ready ? value.toLocaleString("id-ID") : "—"}
      </p>
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

function SlaIndicator({
  application,
  sla = application.sla,
  compact = false,
}: {
  application: Application;
  sla?: Application["sla"];
  compact?: boolean;
}) {
  const remainingLabel = formatSlaRemaining(getSlaDaysRemaining(sla.deadline));
  const Icon =
    sla.tone === "late"
      ? TriangleAlert
      : sla.tone === "done"
        ? CircleCheck
        : Clock3;
  const color =
    sla.tone === "late"
      ? "text-destructive"
      : sla.tone === "due"
        ? "text-warning"
        : sla.tone === "done"
          ? "text-success"
          : "text-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${compact ? "text-xs whitespace-nowrap" : "text-sm whitespace-nowrap"} ${color}`}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        <span className="block">{remainingLabel || sla.label}</span>
        {sla.deadline ? (
          <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
            Batas{" "}
            {formatApiDate(sla.deadline.slice(0, 10), {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function isOwnedBy(application: Application) {
  return application.availableActions.length > 0;
}
