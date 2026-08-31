"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { ArrowRight, Clock3, Search, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/dashboard/app-shell";
import { Input } from "@/components/ui/input";
import {
  ROLE_STORAGE_KEY,
  getActivity,
  getApplicationStatus,
  getApplications,
  getCurrentStage,
  getOwner,
  getRole,
  getRoleActivities,
  stages,
  type Application,
  type RoleId,
} from "@/lib/workflow";

type View = "all" | "mine";

export default function DashboardPage() {
  const [roleId, setRoleId] = useState<RoleId>("teknik");
  const [applications, setApplications] = useState<Application[]>(() =>
    getApplications({}),
  );
  const [view, setView] = useState<View>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setRoleId(
      (window.localStorage.getItem(ROLE_STORAGE_KEY) as RoleId) || "teknik",
    );
    setApplications(getApplications());
    if (new URLSearchParams(window.location.search).get("view") === "mine")
      setView("mine");
  }, []);

  const roleQueue = useMemo(
    () =>
      roleId === "super-user"
        ? applications
        : applications.filter((application) => isOwnedBy(application, roleId)),
    [applications, roleId],
  );
  const visibleApplications = (
    view === "mine" ? roleQueue : applications
  ).filter((application) => {
    const search = query.toLocaleLowerCase("id-ID");
    return `${application.id} ${application.customer} ${application.unit}`
      .toLocaleLowerCase("id-ID")
      .includes(search);
  });
  const roleActivities = getRoleActivities(roleId);
  const activeCount = applications.filter(
    (item) => !item.rejected && item.currentAction,
  ).length;
  const overdueCount = applications.filter(
    (item) => item.sla.tone === "late" && item.currentAction,
  ).length;

  return (
    <AppShell
      active={view === "all" ? "applications" : "dashboard"}
      roleId={roleId}
      onRoleChange={setRoleId}
    >
      <div className="mx-auto w-full max-w-[1480px] min-w-0">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Dashboard permohonan
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Pantau posisi proses, PIC, dan pekerjaan yang perlu
              ditindaklanjuti.
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            Data demo · diperbarui 30 Agu 2026, 14:32 WIB
          </p>
        </header>

        <section
          aria-label="Ringkasan operasional"
          className="mt-6 grid border-y sm:grid-cols-3"
        >
          <SummaryMetric
            label={
              roleId === "super-user"
                ? "Permohonan dipantau"
                : "Tugas role saat ini"
            }
            value={roleQueue.length}
            detail={
              roleId === "super-user"
                ? "Akses monitoring read-only"
                : `${roleActivities.length} aktivitas dalam cakupan role`
            }
          />
          <SummaryMetric
            label="Permohonan aktif"
            value={activeCount}
            detail="Belum selesai atau ditolak"
          />
          <SummaryMetric
            label="Melewati SLA"
            value={overdueCount}
            detail="Memerlukan perhatian"
            danger
          />
        </section>

        <section className="mt-7" aria-labelledby="distribution-title">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="distribution-title"
              className="font-display text-base font-semibold"
            >
              Posisi workflow aktif
            </h2>
            <span className="text-muted-foreground text-xs">7 stage utama</span>
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
                  <p className="text-muted-foreground text-xs">
                    Stage {stage.id}
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {count}
                  </p>
                  <p className="mt-1 text-xs leading-4">{stage.shortLabel}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="applications-title">
          <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2
                id="applications-title"
                className="font-display text-lg font-semibold"
              >
                Daftar permohonan
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {visibleApplications.length} permohonan ditampilkan
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                className="bg-muted grid w-full grid-cols-2 rounded-md p-1 sm:flex sm:w-auto"
                role="tablist"
                aria-label="Jenis daftar"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "all"}
                  className={`h-8 min-w-0 truncate rounded px-2 text-xs font-medium sm:px-3 sm:text-sm ${view === "all" ? "bg-background shadow-xs" : "text-muted-foreground"}`}
                  onClick={() => setView("all")}
                >
                  Semua permohonan
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "mine"}
                  className={`h-8 min-w-0 truncate rounded px-2 text-xs font-medium sm:px-3 sm:text-sm ${view === "mine" ? "bg-background shadow-xs" : "text-muted-foreground"}`}
                  onClick={() => setView("mine")}
                >
                  {roleId === "super-user" ? "Dalam pemantauan" : "Tugas saya"}
                  {` (${roleQueue.length})`}
                </button>
              </div>
              <div className="relative sm:w-72">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari nomor, pelanggan, atau unit"
                  aria-label="Cari permohonan"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {visibleApplications.length > 0 ? (
            <>
              <div className="divide-y border 2xl:hidden">
                {visibleApplications.map((application) => (
                  <ApplicationListItem
                    key={application.id}
                    application={application}
                    roleId={roleId}
                  />
                ))}
              </div>
              <div className="hidden border-x border-b 2xl:block">
                <table className="w-full table-fixed border-collapse text-sm">
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr className="border-b text-left text-xs">
                      <th className="px-4 py-3 font-medium">
                        Nomor permohonan
                      </th>
                      <th className="px-4 py-3 font-medium">Pelanggan</th>
                      <th className="px-4 py-3 font-medium">Unit</th>
                      <th className="px-4 py-3 font-medium">Tahap saat ini</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">PIC</th>
                      <th className="px-4 py-3 font-medium">SLA</th>
                      <th className="px-4 py-3">
                        <span className="sr-only">Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleApplications.map((application) => (
                      <ApplicationRow
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
            <div className="border-x border-b px-6 py-12 text-center">
              <p className="font-medium">Tidak ada permohonan yang sesuai</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Ubah pencarian atau pilih Semua permohonan.
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
    <article className="min-w-0 p-4 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{application.customer}</p>
          <p className="text-muted-foreground mt-1 truncate font-mono text-xs">
            {application.id}
          </p>
        </div>
        <StatusBadge status={getApplicationStatus(application)} />
      </div>

      <dl className="mt-4 grid min-w-0 gap-3 text-sm sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-muted-foreground text-xs">Tahap saat ini</dt>
          <dd className="mt-1 truncate">
            {application.rejected ? "Persetujuan NPS" : stage.shortLabel}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground text-xs">PIC</dt>
          <dd className="mt-1 truncate">
            {application.rejected || !owner ? "—" : owner.label}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground text-xs">SLA</dt>
          <dd className="mt-1">
            <SlaIndicator application={application} />
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t pt-3 text-right">
        <Link
          href={`/permohonan/${application.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
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
}: {
  label: string;
  value: number;
  detail: string;
  danger?: boolean;
}) {
  return (
    <div className="border-b px-5 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">{label}</p>
        {danger && value > 0 ? (
          <TriangleAlert
            className="text-destructive size-4"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <p
        className={`mt-2 text-3xl font-semibold tabular-nums ${danger && value > 0 ? "text-destructive" : ""}`}
      >
        {value}
      </p>
      <p className="text-muted-foreground mt-1 truncate text-xs">{detail}</p>
    </div>
  );
}

function ApplicationRow({
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
  const status = getApplicationStatus(application);

  return (
    <tr className="hover:bg-muted/35 border-b last:border-b-0">
      <td className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap">
        {application.id}
      </td>
      <td className="px-4 py-3">
        <p className="max-w-48 truncate font-medium">{application.customer}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {application.requestType}
        </p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">{application.unit}</td>
      <td className="px-4 py-3">
        <p className="max-w-44 truncate">
          {application.rejected ? "Persetujuan NPS" : stage.shortLabel}
        </p>
        {activity && !application.rejected ? (
          <p className="text-muted-foreground mt-0.5 max-w-44 truncate text-xs">
            {activity.shortLabel}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-3">
        <p className="max-w-40 truncate">
          {application.rejected || !owner ? "—" : owner.label}
        </p>
        {owner && !application.rejected ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{owner.lane}</p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <SlaIndicator application={application} />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/permohonan/${application.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {owned ? "Lanjutkan" : "Lihat"}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "Ditolak" || status === "Terlambat"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "Selesai"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap ${style}`}
    >
      {status}
    </span>
  );
}

function SlaIndicator({ application }: { application: Application }) {
  const color =
    application.sla.tone === "late"
      ? "text-red-700"
      : application.sla.tone === "due"
        ? "text-amber-700"
        : application.sla.tone === "done"
          ? "text-emerald-700"
          : "text-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${color}`}
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
