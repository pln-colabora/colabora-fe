"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Eye,
  LoaderCircle,
  LockKeyhole,
  XCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ActionForm } from "@/components/dashboard/action-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { DetailSkeleton } from "@/components/dashboard/page-skeletons";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplication } from "@/hooks/use-application";
import { useDocumentActions } from "@/hooks/use-document-actions";
import { useSession } from "@/hooks/use-session";
import {
  assignVendor,
  getVendorAccounts,
} from "@/lib/applications";
import { formatApiDate, formatFileSize } from "@/lib/utils";
import {
  activities,
  nodeActions,
  getActivity,
  getApplicationStatus,
  getCurrentStage,
  getDocuments,
  getHistory,
  getOwner,
  getRole,
  stages,
  type ActionId,
  type Application,
  type RoleId,
  type StageId,
} from "@/lib/workflow";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user, error: sessionError } = useSession();
  const roleId = user?.role ?? "user";
  const {
    application,
    setApplication,
    loading,
    error: loadError,
    relatedError,
    relatedLoading,
    reload,
  } = useApplication(id, !!user, true);
  const ready = !!application || !loading;
  const [showForm, setShowForm] = useState(false);

  if (!ready)
    return (
      <AppShell active="applications" roleId={roleId} user={user}>
        {sessionError ? (
          <div role="alert" aria-live="assertive" className="space-y-4">
            <p className="text-destructive text-sm">{sessionError}</p>
            <Button onClick={() => window.location.reload()}>Coba lagi</Button>
          </div>
        ) : (
          <DetailSkeleton />
        )}
      </AppShell>
    );

  if (!application) {
    return (
      <AppShell active="applications" roleId={roleId} user={user}>
        <div className="mx-auto max-w-3xl border px-6 py-16 text-center">
          <h1 className="font-display text-xl font-semibold">
            Detail permohonan belum tersedia
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {loadError || "Permohonan tidak ditemukan."}
          </p>
          <Button
            variant="outline"
            className="mt-6 mr-2"
            onClick={reload}
          >
            Coba lagi
          </Button>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/dashboard?view=all">Kembali ke permohonan</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const currentActivity = getActivity(application.currentAction);
  const owner = currentActivity
    ? getRole(getOwner(currentActivity, application))
    : null;
  const currentStage = getCurrentStage(application);
  const documents = getDocuments(application);
  const history = getHistory(application);

  function handleAdvanced(nextApplication: Application) {
    setApplication(nextApplication);
    setShowForm(false);
    reload();
  }

  return (
    <AppShell active="applications" roleId={roleId} user={user}>
      <div className="mx-auto w-full max-w-[1480px] min-w-0 overflow-x-clip">
        <Link
          href="/dashboard?view=all"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke daftar permohonan
        </Link>

        <header className="mt-5 border-b pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {application.customer}
                </h1>
                <StatusBadge status={getApplicationStatus(application)} />
              </div>
              <p className="text-muted-foreground mt-2 font-mono text-xs">
                {application.number}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4 lg:text-right">
              <HeaderFact
                label="Tahap saat ini"
                value={
                  application.rejected
                    ? "Delegasi PK NPS"
                    : stages.find((stage) => stage.id === currentStage)!
                        .shortLabel
                }
              />
              <HeaderFact
                label="PIC"
                value={
                  application.rejected || !owner
                    ? "—"
                    : `${owner.lane} — ${owner.label}`
                }
              />
              <HeaderFact
                label="SLA"
                value={application.sla.label}
                tone={application.sla.tone}
              />
              <HeaderFact
                label="Terakhir diperbarui"
                value={application.updatedAt}
              />
            </dl>
          </div>
        </header>

        <CurrentAction
          application={application}
          roleId={roleId}
          showForm={showForm}
          onShowForm={() => setShowForm(true)}
          onCancel={() => setShowForm(false)}
          onAdvanced={handleAdvanced}
        />

        <VendorAssignment
          application={application}
          roleId={roleId}
          onSaved={handleAdvanced}
        />
        {relatedError && (
          <p role="alert" aria-live="assertive" className="text-destructive mt-4 flex flex-wrap items-center gap-3 text-sm">
            {relatedError}{" "}
            <Button
              variant="outline"
              disabled={relatedLoading}
              onClick={reload}
            >
              {relatedLoading && (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              )}
              {relatedLoading ? "Memuat..." : "Coba lagi"}
            </Button>
          </p>
        )}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <WorkflowTimeline application={application} />
            <DocumentsSection
              applicationId={application.id}
              documents={documents}
              loading={relatedLoading}
              error={relatedError}
            />
          </div>
          <aside className="space-y-6">
            <ApplicationFacts application={application} />
            <DecisionSummary application={application} />
            <HistorySection
              history={history}
              loading={relatedLoading}
              error={relatedError}
            />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

const vendorAssignmentSchema = z.object({
  vendorId: z.string().trim().min(1, "Akun vendor wajib dipilih."),
});

type VendorAssignmentValues = z.infer<typeof vendorAssignmentSchema>;

function VendorAssignment({
  application,
  roleId,
  onSaved,
}: {
  application: Application;
  roleId: RoleId;
  onSaved: (application: Application) => void;
}) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const form = useForm<VendorAssignmentValues>({
    resolver: zodResolver(vendorAssignmentSchema),
    defaultValues: { vendorId: "" },
  });
  const busy = form.formState.isSubmitting;
  const vendorRole =
    roleId === "perencanaan" && application.decisions.needsPole === true
      ? "vendor-tiang"
      : roleId === "konstruksi"
        ? "vendor-konstruksi"
        : roleId === "transaksi-energi" &&
            !application.connectionType.startsWith("PLG TM")
          ? "vendor-sr-app"
          : null;
  useEffect(() => {
    if (!vendorRole || !open) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getVendorAccounts(vendorRole)
      .then((data) => {
        if (!cancelled) setVendors(data);
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setError(
            error instanceof Error
              ? error.message
              : "Daftar vendor gagal dimuat.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vendorRole, open, reload]);
  if (
    !vendorRole ||
    application.decisions.npsApproved !== true ||
    application.completed ||
    application.rejected
  )
    return null;
  return (
    <details
      className="bg-card mt-4 rounded-lg p-5"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm font-medium">
        Penugasan {getRole(vendorRole).label}
      </summary>
      <p className="text-muted-foreground mt-2 text-sm">
        Vendor hanya dapat mengakses permohonan setelah akunnya ditugaskan.
        Penugasan diperiksa oleh server dan hanya dapat dibuat sekali.
      </p>
      <Form {...form}>
        <form
          className="mt-4"
          noValidate
          onSubmit={form.handleSubmit(async ({ vendorId }) => {
            if (saved) return;
            form.clearErrors("root");
          try {
            const updated = await assignVendor(
              application.id,
              vendorId.trim(),
              vendorRole,
            );
            setSaved(true);
            toast.success("Vendor berhasil ditugaskan.");
            onSaved(updated);
          } catch (requestError) {
            const message =
              requestError instanceof Error
                ? requestError.message
                : "Penugasan vendor gagal.";
            form.setError("root", { message });
            toast.error(message);
          }
          })}
        >
          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Akun {getRole(vendorRole).label}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={busy || saved || loading}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue
                        placeholder={
                          loading ? "Memuat vendor..." : "Pilih akun vendor"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        {!loading && !error && !vendors.length && (
          <p className="text-muted-foreground mt-2 text-sm">
            Belum ada akun vendor untuk peran ini.
          </p>
        )}
        {error && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            {error}{" "}
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setReload((value) => value + 1)}
            >
              {loading && (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              )}
              {loading ? "Memuat..." : "Muat ulang vendor"}
            </Button>
          </p>
        )}
          {form.formState.errors.root?.message && (
            <p role="alert" className="text-destructive mt-2 text-sm">
              {form.formState.errors.root.message}
            </p>
          )}
          <Button className="mt-3" disabled={busy || saved || loading}>
            {busy && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {busy ? "Menyimpan..." : "Tugaskan vendor"}
          </Button>
        </form>
      </Form>
    </details>
  );
}

function CurrentAction({
  application,
  roleId,
  showForm,
  onShowForm,
  onCancel,
  onAdvanced,
}: {
  application: Application;
  roleId: RoleId;
  showForm: boolean;
  onShowForm: () => void;
  onCancel: () => void;
  onAdvanced: (application: Application) => void;
}) {
  const [selectedNode, setSelectedNode] = useState("");
  const available = application.availableActions.filter(
    (action) => !action.path.endsWith("/vendor-assignments"),
  );
  const action =
    available.find((action) => action.workflow_node === selectedNode) ??
    available[0];
  const activity = getActivity(
    action ? nodeActions[action.workflow_node] : application.currentAction,
  );
  if (application.rejected) {
    return (
      <section
        className="bg-card mt-6 rounded-lg px-5 py-4"
        aria-labelledby="current-action-title"
      >
        <div className="flex items-start gap-3">
          <XCircle
            className="text-destructive mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h2
              id="current-action-title"
              className="font-display text-destructive font-semibold"
            >
              PK dikembalikan
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              NPS mengembalikan perintah kerja. Workflow dihentikan dan tidak
              ada aktivitas lanjutan.
            </p>
          </div>
        </div>
      </section>
    );
  }
  if (application.completed || !activity) {
    return (
      <section
        className="bg-card mt-6 rounded-lg px-5 py-4"
        aria-labelledby="current-action-title"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="text-success mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h2
              id="current-action-title"
              className="font-display text-success font-semibold"
            >
              {application.completed
                ? "Permohonan selesai"
                : "Tidak ada tindakan tersedia"}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {application.completed
                ? "Seluruh aktivitas dan dokumen penutupan telah lengkap."
                : "Status aktivitas mengikuti data server."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const ownerId = getOwner(activity, application);
  const owner = getRole(ownerId);
  const ownsAction = !!action;
  const isMonitoring = roleId === "super-user";
  const isSurvey = activity.id === "2";
  return (
    <section
      className="bg-card mt-6 min-w-0 rounded-lg px-5 py-4"
      aria-labelledby="current-action-title"
    >
      {available.length > 1 && (
        <div className="mb-4">
          <label
            htmlFor="available-action"
            className="mb-2 block text-sm font-medium"
          >
            Aktivitas yang dapat Anda kerjakan
          </label>
          <Select
            value={action?.workflow_node}
            onValueChange={(value) => {
              setSelectedNode(value);
              onCancel();
            }}
          >
            <SelectTrigger id="available-action" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {available.map((item) => (
                <SelectItem key={item.workflow_node} value={item.workflow_node}>
                  {getActivity(nodeActions[item.workflow_node])?.label ??
                    item.workflow_node}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {ownsAction ? (
            <Clock3
              className="text-warning mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
          ) : isMonitoring ? (
            <Eye
              className="text-muted-foreground mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <LockKeyhole
              className="text-muted-foreground mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
          )}
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold ${ownsAction ? "text-warning" : "text-muted-foreground"}`}
            >
              {ownsAction
                ? "Tindakan diperlukan"
                : isMonitoring
                  ? "Mode monitoring"
                  : "Menunggu tindakan"}
            </p>
            <h2
              id="current-action-title"
              className="font-display mt-1 text-lg font-semibold"
            >
              {activity.label}
            </h2>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
              {ownsAction
                ? activity.description
                : isMonitoring
                  ? `Aktivitas berada pada ${owner.lane} — ${owner.label}. Super User dapat memantau detail tanpa mengubah workflow.`
                  : `Menunggu tindakan dari ${owner.lane} — ${owner.label}. Anda tetap dapat melihat seluruh informasi permohonan.`}
            </p>
          </div>
        </div>
        {ownsAction && isSurvey ? (
          <Button asChild className="min-h-11 w-full shrink-0 sm:w-auto">
            <Link href={`/permohonan/${application.id}/survei`}>
              Lanjutkan proses
              <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        ) : ownsAction && !showForm ? (
          <Button
            className="min-h-11 w-full shrink-0 sm:w-auto"
            onClick={onShowForm}
          >
            Lanjutkan proses
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {showForm && ownsAction && !isSurvey ? (
        <ActionForm
          application={application}
          key={action!.workflow_node}
          action={action!}
          onCancel={onCancel}
          onSaved={onAdvanced}
        />
      ) : null}
    </section>
  );
}

function WorkflowTimeline({ application }: { application: Application }) {
  return (
    <section
      aria-labelledby="workflow-title"
      className="bg-card rounded-lg p-5 sm:p-6"
    >
      <div className="flex items-end justify-between border-b pb-3">
        <div>
          <h2
            id="workflow-title"
            className="font-display text-lg font-semibold"
          >
            Tahapan proses
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            17 aktivitas utama dan percabangan yang berlaku.
          </p>
        </div>
        <span className="text-muted-foreground text-xs">
          Tahap {getCurrentStage(application)} dari 7
        </span>
      </div>
      <ol className="mt-5 space-y-0">
        {stages.map((stage, index) => {
          const stageActivities = activities.filter(
            // Reservasi Material (9) and Perakitan & Tera APP (10) are completed
            // atomically by one backend endpoint, so they read as a single step.
            (activity) => activity.stage === stage.id && activity.id !== "10",
          );
          const stageStatus = getStageStatus(stage.id, application);
          return (
            <li
              key={stage.id}
              className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3 pb-6 last:pb-0"
            >
              {index < stages.length - 1 ? (
                <span
                  className="bg-border absolute top-7 bottom-0 left-[13px] w-px"
                  aria-hidden="true"
                />
              ) : null}
              <StageMarker status={stageStatus} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-muted-foreground mr-2 text-xs">
                      Tahap {stage.id}
                    </span>
                    <h3 className="font-display inline font-semibold">
                      {stage.label}
                    </h3>
                  </div>
                  <StageStatusLabel status={stageStatus} />
                </div>
                <ul className="bg-muted/25 mt-3 divide-y rounded-md border">
                  {stageActivities.map((activity) => {
                    const status = getActivityStatus(activity.id, application);
                    const owner = getRole(getOwner(activity, application));
                    return (
                      <li
                        key={activity.id}
                        className="grid gap-1 px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_180px_110px] sm:items-center"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <ActivityStatusIcon status={status} />
                          {activity.id === "9"
                            ? "Reservasi Material & Perakitan/Tera APP"
                            : activity.shortLabel}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {owner.lane} — {owner.label}
                        </span>
                        <span className="text-muted-foreground text-xs sm:text-right">
                          {activityStatusLabel(status)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

type ProgressStatus = "done" | "current" | "future" | "skipped" | "rejected";

function getStageStatus(
  stageId: StageId,
  application: Application,
): ProgressStatus {
  if (application.rejected && stageId === 3) return "rejected";
  const nodes = application.nodes.filter(
    (node) => node.stage_number === stageId,
  );
  if (
    nodes.length &&
    nodes.every(
      (node) => node.status === "completed" || node.status === "skipped",
    )
  )
    return "done";
  if (
    nodes.some(
      (node) => node.status === "available" || node.status === "in_progress",
    )
  )
    return "current";
  return "future";
}

function getActivityStatus(
  id: ActionId,
  application: Application,
): ProgressStatus {
  if (application.rejected && id === "5") return "rejected";
  const nodes = application.nodes.filter(
    (node) => nodeActions[node.workflow_node] === id,
  );
  if (!nodes.length) return "future";
  if (nodes.every((node) => node.status === "skipped")) return "skipped";
  if (
    nodes.every(
      (node) => node.status === "completed" || node.status === "skipped",
    )
  )
    return "done";
  if (
    nodes.some(
      (node) => node.status === "available" || node.status === "in_progress",
    )
  )
    return "current";
  return "future";
}

function StageMarker({ status }: { status: ProgressStatus }) {
  const style =
    status === "done"
      ? "border border-success-border bg-success-surface text-success"
      : status === "current"
        ? "border-2 border-warning-border bg-warning-surface text-warning"
        : status === "rejected"
          ? "border border-destructive-border bg-destructive-surface text-destructive"
          : "border bg-background text-muted-foreground";
  return (
    <span
      className={`relative z-10 flex size-7 items-center justify-center rounded-full ${style}`}
    >
      {status === "done" ? (
        <Check className="size-4" />
      ) : status === "rejected" ? (
        <XCircle className="size-4" />
      ) : (
        <span className="text-xs font-semibold">
          {status === "current" ? "•" : ""}
        </span>
      )}
    </span>
  );
}

function StageStatusLabel({ status }: { status: ProgressStatus }) {
  return (
    <span className="text-muted-foreground text-xs">
      {status === "done"
        ? "Selesai"
        : status === "current"
          ? "Sedang berjalan"
          : status === "rejected"
            ? "Ditolak"
            : "Belum dimulai"}
    </span>
  );
}

function ActivityStatusIcon({ status }: { status: ProgressStatus }) {
  if (status === "done")
    return (
      <CheckCircle2
        className="text-success size-4 shrink-0"
        aria-hidden="true"
      />
    );
  if (status === "rejected")
    return (
      <XCircle
        className="text-destructive size-4 shrink-0"
        aria-hidden="true"
      />
    );
  if (status === "current")
    return (
      <Clock3 className="text-warning size-4 shrink-0" aria-hidden="true" />
    );
  return (
    <Circle
      className="text-muted-foreground size-4 shrink-0"
      aria-hidden="true"
    />
  );
}

function activityStatusLabel(status: ProgressStatus) {
  return status === "done"
    ? "Selesai"
    : status === "current"
      ? "Perlu tindakan"
      : status === "skipped"
        ? "Dilewati oleh keputusan"
        : status === "rejected"
          ? "Ditolak"
          : "Belum dimulai";
}

function DocumentsSection({
  applicationId,
  documents,
  loading,
  error,
}: {
  applicationId: string;
  loading: boolean;
  error: string;
  documents: ReturnType<typeof getDocuments>;
}) {
  const { activeAction, openDocument, downloadDocument } =
    useDocumentActions(applicationId);

  return (
    <section
      aria-labelledby="documents-title"
      className="bg-card rounded-lg p-5 sm:p-6"
    >
      <div className="border-b pb-3">
        <h2 id="documents-title" className="font-display text-lg font-semibold">
          Dokumen & Evidence
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Hanya dokumen dari aktivitas yang telah diselesaikan.
        </p>
      </div>
      {loading ? (
        <div role="status" aria-busy="true" className="space-y-3 py-5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <span className="sr-only">Memuat dokumen...</span>
        </div>
      ) : error ? (
        <p className="text-destructive py-8 text-sm">
          Dokumen belum berhasil dimuat.
        </p>
      ) : documents.length ? (
        <ul className="divide-y">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center gap-3 py-3">
              <FileText
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{document.name}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {getActivity(document.actionId)?.shortLabel ?? "Evidence"} ·{" "}
                  {formatFileSize(document.sizeBytes)} ·{" "}
                  {displayHistoryDate(document.addedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  disabled={!!activeAction}
                  aria-label={`Buka ${document.name} di tab baru`}
                  title="Buka evidence"
                  onClick={() => void openDocument(document)}
                >
                  {activeAction?.documentId === document.id &&
                  activeAction.type === "open" ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <ExternalLink className="size-4" aria-hidden="true" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  disabled={!!activeAction}
                  aria-label={`Unduh ${document.name}`}
                  title="Unduh evidence"
                  onClick={() => void downloadDocument(document)}
                >
                  {activeAction?.documentId === document.id &&
                  activeAction.type === "download" ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Download className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground py-8 text-sm">
          Belum ada dokumen yang tersedia.
        </p>
      )}
    </section>
  );
}

function ApplicationFacts({ application }: { application: Application }) {
  const facts = [
    ["Nomor permohonan", application.number],
    ["No. HP / telepon", application.phone],
    ["Jenis permohonan", application.requestType],
    ["Jenis sambungan", application.connectionType],
    ["Unit / ULP", application.unit],
    ["Lokasi", application.location],
    ["Daya", application.power],
    ["Tanggal permohonan", formatDate(application.requestedAt)],
  ];
  return (
    <section aria-labelledby="facts-title" className="bg-card rounded-lg p-5">
      <h2
        id="facts-title"
        className="font-display border-b pb-3 text-base font-semibold"
      >
        Informasi permohonan
      </h2>
      <dl className="divide-y">
        {facts.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-2.5 text-sm"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DecisionSummary({ application }: { application: Application }) {
  return (
    <section
      aria-labelledby="decision-title"
      className="bg-card rounded-lg p-5"
    >
      <h2
        id="decision-title"
        className="font-display border-b pb-3 text-base font-semibold"
      >
        Keputusan workflow
      </h2>
      <dl className="divide-y">
        <DecisionRow
          label="Kebutuhan tiang"
          value={decisionValue(application.decisions.needsPole)}
        />
        <DecisionRow
          label="Delegasi PK NPS"
          value={
            application.rejected
              ? "Dikembalikan"
              : application.decisions.npsApproved === true
                ? "Didelegasikan"
                : "Belum diputuskan"
          }
          danger={application.rejected}
        />
        <DecisionRow
          label="Perlu PDKB"
          value={decisionValue(application.decisions.needsPdkb)}
        />
      </dl>
    </section>
  );
}

function HistorySection({
  history,
  loading,
  error,
}: {
  loading: boolean;
  error: string;
  history: ReturnType<typeof getHistory>;
}) {
  return (
    <section aria-labelledby="history-title" className="bg-card rounded-lg p-5">
      <h2
        id="history-title"
        className="font-display border-b pb-3 text-base font-semibold"
      >
        Riwayat aktivitas
      </h2>
      {loading ? (
        <div role="status" aria-busy="true" className="mt-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-11/12" />
          <span className="sr-only">Memuat riwayat...</span>
        </div>
      ) : error ? (
        <p className="text-destructive mt-4 text-sm">
          Riwayat belum berhasil dimuat.
        </p>
      ) : history.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Belum ada riwayat aktivitas.
        </p>
      ) : null}
      {!loading && !error && (
        <ol className="mt-4 space-y-5">
          {history.slice(0, 10).map((item) => (
            <li
              key={item.id}
              className="before:bg-border relative pl-5 text-sm before:absolute before:top-1.5 before:left-0 before:size-2 before:rounded-full"
            >
              <p className="text-muted-foreground text-xs">
                {displayHistoryDate(item.at)}
              </p>
              <p className="mt-1 font-medium">{item.title}</p>
              {item.detail && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {item.detail}
                </p>
              )}
              <p className="text-muted-foreground mt-0.5 text-xs">
                oleh {item.by}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function HeaderFact({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: Application["sla"]["tone"];
}) {
  const color =
    tone === "late"
      ? "text-destructive"
      : tone === "due"
        ? "text-warning"
        : tone === "done"
          ? "text-success"
          : "";
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={`mt-1 max-w-44 text-sm font-medium ${color}`}>{value}</dd>
    </div>
  );
}

function DecisionRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-medium ${danger ? "text-destructive" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
function decisionValue(value?: boolean) {
  return value === true
    ? "Ya"
    : value === false
      ? "Tidak — aktivitas dilewati"
      : "Belum diputuskan";
}
function formatDate(date: string) {
  if (!date || Number.isNaN(Date.parse(date))) return "—";
  return formatApiDate(date, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function displayHistoryDate(value: string) {
  if (!value.includes("T")) return value;
  return formatApiDate(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
