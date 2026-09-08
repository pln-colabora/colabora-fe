"use client";

import { Suspense, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ArrowRight, Clock3, Search, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/dashboard/app-shell";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ROLE_STORAGE_KEY,
  getActivity,
  getApplicationStatus,
  getApplications,
  getCurrentStage,
  getOwner,
  getRole,
  stages,
  type Application,
  type RoleId,
} from "@/lib/workflow";

type View = "all" | "mine";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-6">
          Memuat permohonan...
        </p>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const isHome = !searchParams.has("view");
  const view: View = searchParams.get("view") === "mine" ? "mine" : "all";
  const [ready, setReady] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleId, setRoleId] = useState<RoleId>("teknik");
  const [applications, setApplications] = useState<Application[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setRoleId(
      (window.localStorage.getItem(ROLE_STORAGE_KEY) as RoleId) || "teknik",
    );
    setApplications(getApplications());
    setReady(true);
  }, []);

  const roleQueue = useMemo(
    () =>
      roleId === "super-user"
        ? applications
        : applications.filter((application) => isOwnedBy(application, roleId)),
    [applications, roleId],
  );
  const filteredApplications = (
    view === "mine" ? roleQueue : applications
  ).filter((application) => {
    const search = query.trim().toLocaleLowerCase("id-ID");
    return (
      `${application.id} ${application.customer} ${application.unit}`
        .toLocaleLowerCase("id-ID")
        .includes(search) &&
      (!statusFilter || getApplicationStatus(application) === statusFilter)
    );
  });
  const role = getRole(roleId);
  const visibleApplications = isHome
    ? [...applications]
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
        .slice(0, 5)
    : filteredApplications;
  const completedCount = applications.filter(
    (item) => getApplicationStatus(item) === "Selesai",
  ).length;
  const activeCount = applications.filter(
    (item) => !item.rejected && item.currentAction,
  ).length;
  const overdueCount = applications.filter(
    (item) => item.sla.tone === "late" && item.currentAction,
  ).length;

  return (
    <AppShell
      active={isHome ? "dashboard" : "applications"}
      roleId={roleId}
      onRoleChange={setRoleId}
    >
      <div className="w-full min-w-0">
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
                    {role.label}
                  </strong>
                  .
                </>
              ) : (
                "Cari permohonan dan lanjutkan pekerjaan sesuai peran Anda."
              )}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            Data demo / penyimpanan lokal
          </p>
        </header>

        {isHome && (
          <>
            <p className="text-muted-foreground mt-2 text-sm">
              {role.lane} /{" "}
              {roleId === "super-user"
                ? "Pemantauan tanpa mengubah aktivitas"
                : "Permohonan PB/PD"}
            </p>
            <section
              aria-label="Ringkasan seluruh permohonan demo"
              className="mt-6 grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4"
            >
              <SummaryMetric
                tone="primary"
                label="Total permohonan"
                value={applications.length}
                detail="Seluruh data demo"
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
                <Link href="/dashboard?view=mine">
                  {roleId === "super-user"
                    ? "Lihat permohonan dalam pemantauan"
                    : "Lihat tugas saya"}{" "}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </>
        )}

        {!isHome && ready && (
          <details className="bg-card mt-6 rounded-lg border px-4 py-2">
            <summary className="cursor-pointer py-2 text-sm font-medium">
              Posisi proses aktif / {stages.length} tahap
            </summary>
            <section className="mt-7" aria-labelledby="distribution-title">
              <div className="mb-3 flex items-center justify-between">
                <h2
                  id="distribution-title"
                  className="font-display text-base font-semibold"
                >
                  Posisi proses aktif
                </h2>
                <span className="text-muted-foreground text-sm">
                  7 tahap utama
                </span>
              </div>
              <div className="grid grid-cols-2 border sm:grid-cols-4 xl:grid-cols-7">
                {stages.map((stage) => {
                  const count = applications.filter(
                    (application) =>
                      !application.rejected &&
                      application.currentAction &&
                      getCurrentStage(application) === stage.id,
                  ).length;
                  return (
                    <div
                      key={stage.id}
                      className="border-r border-b px-4 py-3 last:border-r-0 xl:border-b-0 sm:[&:nth-child(4n)]:border-r-0 xl:[&:nth-child(4n)]:border-r xl:[&:nth-child(7n)]:border-r-0"
                    >
                      <p className="text-muted-foreground text-sm">
                        Tahap {stage.id}
                      </p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">
                        {count}
                      </p>
                      <p className="mt-1 text-sm leading-4">
                        {stage.shortLabel}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </details>
        )}

        <section
          className="bg-card mt-6 min-w-0 rounded-lg border"
          aria-labelledby="applications-title"
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
                href="/dashboard?view=all"
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
                    href="/dashboard?view=all"
                    aria-current={view === "all" ? "page" : undefined}
                    className={`flex min-h-11 min-w-0 items-center justify-center rounded px-3 text-sm font-medium ${view === "all" ? "bg-card text-primary" : "text-muted-foreground"}`}
                  >
                    Semua permohonan
                  </Link>
                  <Link
                    href="/dashboard?view=mine"
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
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nomor, pelanggan, atau unit"
                    aria-label="Cari permohonan"
                    className="h-11 pl-9"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="status-filter" className="text-sm">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    className="bg-card h-11 rounded-md border px-3 text-sm"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">Semua status</option>
                    {Array.from(
                      new Set(applications.map(getApplicationStatus)),
                    ).map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  {(query || statusFilter) && (
                    <Button
                      variant="ghost"
                      className="min-h-11"
                      onClick={() => {
                        setQuery("");
                        setStatusFilter("");
                      }}
                    >
                      Reset filter
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {!ready ? (
            <div role="status" className="space-y-3 p-5">
              <p className="text-muted-foreground text-sm">
                Memuat permohonan...
              </p>
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="bg-muted h-16 rounded-md"
                  aria-hidden="true"
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
                    roleId={roleId}
                  />
                ))}
              </div>
              <div className="hidden overflow-x-auto rounded-b-lg lg:block">
                <table
                  className={`w-full border-collapse text-sm ${isHome ? "min-w-[880px]" : "min-w-[1120px]"}`}
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
                        roleId={roleId}
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
                  ? "Belum ada data permohonan di browser ini."
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
  roleId,
}: {
  application: Application;
  roleId: RoleId;
}) {
  const activity = getActivity(application.currentAction);
  const stage = stages.find(
    (item) => item.id === getCurrentStage(application),
  )!;
  const owner = activity ? getRole(getOwner(activity, application)) : null;
  const owned = isOwnedBy(application, roleId);

  return (
    <article className="min-w-0 py-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{application.customer}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {application.requestType} / {application.unit}
          </p>
          <p className="text-muted-foreground mt-1 truncate font-mono text-sm">
            {application.id}
          </p>
        </div>
        <StatusBadge status={getApplicationStatus(application)} />
      </div>

      <dl className="mt-3 grid min-w-0 grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-muted-foreground text-sm">Tahap saat ini</dt>
          <dd className="mt-1 truncate">
            {application.rejected ? "Persetujuan NPS" : stage.shortLabel}
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
          dateTime={application.requestedAt}
          className="text-muted-foreground text-sm"
        >
          {new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(new Date(`${application.requestedAt}T00:00:00`))}
        </time>
        <Link
          href={`/permohonan/${application.id}`}
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
    <div className="bg-card rounded-lg border px-4 py-4 lg:px-5 lg:py-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">{label}</p>
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
  roleId,
  compact = false,
}: {
  application: Application;
  roleId: RoleId;
  compact?: boolean;
}) {
  const activity = getActivity(application.currentAction);
  const stage = stages.find(
    (item) => item.id === getCurrentStage(application),
  )!;
  const owner = activity ? getRole(getOwner(activity, application)) : null;
  const owned = isOwnedBy(application, roleId);
  const status = getApplicationStatus(application);

  return (
    <tr className="hover:bg-muted/35 border-b last:border-b-0">
      <td className="px-4 py-3 font-mono text-sm font-medium whitespace-nowrap">
        {application.id}
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
          {application.rejected ? "Persetujuan NPS" : stage.shortLabel}
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
          <time dateTime={application.requestedAt}>
            {new Intl.DateTimeFormat("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(`${application.requestedAt}T00:00:00`))}
          </time>
        </td>
      )}
      <td className="px-4 py-3">
        <SlaIndicator application={application} />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/permohonan/${application.id}`}
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

function isOwnedBy(application: Application, roleId: RoleId) {
  if (
    !application.currentAction ||
    application.rejected ||
    roleId === "super-user"
  )
    return false;
  const activity = getActivity(application.currentAction);
  return activity ? getOwner(activity, application) === roleId : false;
}
