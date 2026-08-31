"use client";

import { useEffect, useState, type FormEvent } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
  Eye,
  LockKeyhole,
  Upload,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ROLE_STORAGE_KEY,
  activities,
  advanceApplication,
  getActiveSequence,
  getActivity,
  getApplicationStatus,
  getApplications,
  getCurrentStage,
  getDocuments,
  getHistory,
  getInitialCompletedActionIds,
  getOwner,
  getRole,
  stages,
  type ActionId,
  type Application,
  type FieldDefinition,
  type RoleId,
  type StageId,
} from "@/lib/workflow";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const [roleId, setRoleId] = useState<RoleId>("teknik");
  const [application, setApplication] = useState<Application | undefined>(() =>
    getApplications({}).find((item) => item.id === id),
  );
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setRoleId(
      (window.localStorage.getItem(ROLE_STORAGE_KEY) as RoleId) || "teknik",
    );
    setApplication(getApplications().find((item) => item.id === id));
  }, [id]);

  if (!application) {
    return (
      <AppShell active="applications" roleId={roleId} onRoleChange={setRoleId}>
        <div className="mx-auto max-w-3xl border px-6 py-16 text-center">
          <h1 className="font-display text-xl font-semibold">
            Permohonan tidak ditemukan
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Nomor permohonan tidak tersedia pada data demo.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/dashboard">Kembali ke dashboard</Link>
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
    setFeedback(
      nextApplication.rejected
        ? "Keputusan tersimpan. Workflow permohonan dihentikan."
        : nextApplication.currentAction
          ? `Aktivitas selesai. Permohonan diteruskan ke ${getRole(getOwner(getActivity(nextApplication.currentAction)!, nextApplication)).label}.`
          : "Seluruh proses selesai. Permohonan telah ditutup.",
    );
  }

  return (
    <AppShell
      active="applications"
      roleId={roleId}
      onRoleChange={(nextRole) => {
        setRoleId(nextRole);
        setShowForm(false);
      }}
    >
      <div className="mx-auto w-full max-w-[1480px] min-w-0">
        <Link
          href="/dashboard"
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
                {application.id}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4 lg:text-right">
              <HeaderFact
                label="Tahap saat ini"
                value={
                  application.rejected
                    ? "Persetujuan NPS"
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
                label="Update terakhir"
                value={application.updatedAt}
              />
            </div>
          </div>
        </header>

        {feedback ? (
          <div
            role="status"
            className="mt-5 flex items-start gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>{feedback}</span>
          </div>
        ) : null}

        <CurrentAction
          application={application}
          roleId={roleId}
          showForm={showForm}
          onShowForm={() => setShowForm(true)}
          onCancel={() => setShowForm(false)}
          onAdvanced={handleAdvanced}
        />

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-8">
            <WorkflowTimeline application={application} />
            <DocumentsSection documents={documents} />
          </div>
          <aside className="space-y-8">
            <ApplicationFacts application={application} />
            <DecisionSummary application={application} />
            <HistorySection history={history} />
          </aside>
        </div>
      </div>
    </AppShell>
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
  const activity = getActivity(application.currentAction);
  if (application.rejected) {
    return (
      <section
        className="mt-6 border-l-4 border-red-500 bg-red-50 px-5 py-4"
        aria-labelledby="current-action-title"
      >
        <div className="flex items-start gap-3">
          <XCircle
            className="mt-0.5 size-5 shrink-0 text-red-700"
            aria-hidden="true"
          />
          <div>
            <h2
              id="current-action-title"
              className="font-display font-semibold text-red-900"
            >
              Permohonan ditolak
            </h2>
            <p className="mt-1 text-sm text-red-800">
              NPS menolak permohonan ini. Workflow dihentikan dan tidak ada
              aktivitas lanjutan.
            </p>
          </div>
        </div>
      </section>
    );
  }
  if (!activity) {
    return (
      <section
        className="mt-6 border-l-4 border-emerald-600 bg-emerald-50 px-5 py-4"
        aria-labelledby="current-action-title"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-emerald-700"
            aria-hidden="true"
          />
          <div>
            <h2
              id="current-action-title"
              className="font-display font-semibold text-emerald-900"
            >
              Permohonan selesai
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              Seluruh aktivitas dan dokumen penutupan telah lengkap.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const ownerId = getOwner(activity, application);
  const owner = getRole(ownerId);
  const ownsAction = ownerId === roleId;
  const isMonitoring = roleId === "super-user";
  return (
    <section
      className={`mt-6 border-l-4 px-5 py-4 ${ownsAction ? "border-amber-500 bg-amber-50" : "border-border bg-muted/45"}`}
      aria-labelledby="current-action-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {ownsAction ? (
            <Clock3
              className="mt-0.5 size-5 shrink-0 text-amber-700"
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
          <div>
            <p
              className={`text-xs font-semibold tracking-wide uppercase ${ownsAction ? "text-amber-800" : "text-muted-foreground"}`}
            >
              {ownsAction
                ? "Tindakan Anda dibutuhkan"
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
        {ownsAction && !showForm ? (
          <Button onClick={onShowForm}>
            Lanjutkan proses
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {showForm && ownsAction ? (
        <ActionForm
          application={application}
          activityId={activity.id}
          roleId={roleId}
          onCancel={onCancel}
          onAdvanced={onAdvanced}
        />
      ) : null}
    </section>
  );
}

function ActionForm({
  application,
  activityId,
  roleId,
  onCancel,
  onAdvanced,
}: {
  application: Application;
  activityId: ActionId;
  roleId: RoleId;
  onCancel: () => void;
  onAdvanced: (application: Application) => void;
}) {
  const activity = getActivity(activityId)!;
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      activity.fields.map((field) => [field.name, field.options?.[0] ?? ""]),
    ),
  );
  const [evidenceName, setEvidenceName] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdvanced(advanceApplication(application, roleId, values, evidenceName));
  }

  return (
    <form onSubmit={submit} className="mt-5 border-t border-amber-200 pt-5">
      <div className="mb-5 grid gap-3 border-b border-amber-200 pb-4 text-sm sm:grid-cols-3">
        <MiniFact label="Nomor permohonan" value={application.id} mono />
        <MiniFact label="Pelanggan" value={application.customer} />
        <MiniFact label="Lokasi" value={application.location} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {activity.fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            value={values[field.name] ?? ""}
            onChange={(value) =>
              setValues((current) => ({ ...current, [field.name]: value }))
            }
          />
        ))}
      </div>
      {activity.evidence ? (
        <div className="mt-5">
          <Label htmlFor={`evidence-${activity.id}`}>
            {activity.evidence}{" "}
            <span className="text-muted-foreground font-normal">(PDF/JPG)</span>
          </Label>
          <label
            htmlFor={`evidence-${activity.id}`}
            className="border-input bg-background mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-4 text-center"
          >
            <Upload
              className="text-muted-foreground size-5"
              aria-hidden="true"
            />
            <span className="mt-2 text-sm font-medium">
              {evidenceName || "Pilih file dummy"}
            </span>
            <span className="text-muted-foreground mt-1 text-xs">
              Nama file akan ditambahkan ke Dokumen & Evidence.
            </span>
          </label>
          <Input
            id={`evidence-${activity.id}`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            required
            onChange={(event) =>
              setEvidenceName(event.target.files?.[0]?.name ?? "")
            }
          />
        </div>
      ) : null}
      {activity.id === "5" ? (
        <p className="mt-4 text-xs text-red-700">
          Keputusan Ditolak akan menghentikan workflow dan tidak dapat
          dilanjutkan pada data demo ini.
        </p>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Simpan dan selesaikan aktivitas</Button>
      </div>
    </form>
  );
}

function FormField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `field-${field.name}`;
  const wrapperClass = field.type === "textarea" ? "md:col-span-2" : "";
  return (
    <div className={wrapperClass}>
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className="bg-background mt-2 min-h-24"
          required
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm"
          required
        >
          {field.options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <Input
          id={id}
          type={field.type ?? "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className="bg-background mt-2 h-10"
          required
        />
      )}
    </div>
  );
}

function WorkflowTimeline({ application }: { application: Application }) {
  const completed = new Set(getInitialCompletedActionIds(application));
  const activeSequence = new Set(getActiveSequence(application));
  return (
    <section aria-labelledby="workflow-title">
      <div className="flex items-end justify-between border-b pb-3">
        <div>
          <h2
            id="workflow-title"
            className="font-display text-lg font-semibold"
          >
            Timeline workflow
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            17 aktivitas utama dan branch yang berlaku.
          </p>
        </div>
        <span className="text-muted-foreground text-xs">
          Stage {getCurrentStage(application)} dari 7
        </span>
      </div>
      <ol className="mt-5 space-y-0">
        {stages.map((stage, index) => {
          const stageActivities = activities.filter(
            (activity) => activity.stage === stage.id,
          );
          const stageStatus = getStageStatus(stage.id, application, completed);
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
                      Stage {stage.id}
                    </span>
                    <h3 className="font-display inline font-semibold">
                      {stage.label}
                    </h3>
                  </div>
                  <StageStatusLabel status={stageStatus} />
                </div>
                <ul className="mt-3 divide-y border-y">
                  {stageActivities.map((activity) => {
                    const status = getActivityStatus(
                      activity.id,
                      application,
                      completed,
                      activeSequence,
                    );
                    const owner = getRole(getOwner(activity, application));
                    return (
                      <li
                        key={activity.id}
                        className="grid gap-1 px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_180px_110px] sm:items-center"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <ActivityStatusIcon status={status} />
                          {activity.shortLabel}
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
  completed: Set<ActionId>,
): ProgressStatus {
  if (application.rejected && stageId === 3) return "rejected";
  const applicable = activities.filter(
    (activity) =>
      activity.stage === stageId &&
      getActiveSequence(application).includes(activity.id),
  );
  if (
    applicable.length > 0 &&
    applicable.every((activity) => completed.has(activity.id))
  )
    return "done";
  if (
    application.currentAction &&
    getActivity(application.currentAction)?.stage === stageId
  )
    return "current";
  if (!application.currentAction && stageId === 7) return "done";
  return "future";
}

function getActivityStatus(
  id: ActionId,
  application: Application,
  completed: Set<ActionId>,
  activeSequence: Set<ActionId>,
): ProgressStatus {
  if (application.rejected && id === "5") return "rejected";
  if (
    (id === "7b" || id === "12b") &&
    application.decisions.needsPdkb === undefined
  )
    return "future";
  if (!activeSequence.has(id)) return "skipped";
  if (completed.has(id)) return "done";
  if (application.currentAction === id) return "current";
  return "future";
}

function StageMarker({ status }: { status: ProgressStatus }) {
  const style =
    status === "done"
      ? "bg-emerald-600 text-white"
      : status === "current"
        ? "border-2 border-amber-500 bg-amber-50 text-amber-800"
        : status === "rejected"
          ? "bg-red-600 text-white"
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
        className="size-4 shrink-0 text-emerald-600"
        aria-hidden="true"
      />
    );
  if (status === "rejected")
    return (
      <XCircle className="size-4 shrink-0 text-red-600" aria-hidden="true" />
    );
  if (status === "current")
    return (
      <Clock3 className="size-4 shrink-0 text-amber-600" aria-hidden="true" />
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
  documents,
}: {
  documents: ReturnType<typeof getDocuments>;
}) {
  return (
    <section aria-labelledby="documents-title">
      <div className="border-b pb-3">
        <h2 id="documents-title" className="font-display text-lg font-semibold">
          Dokumen & Evidence
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Hanya dokumen dari aktivitas yang telah diselesaikan.
        </p>
      </div>
      {documents.length ? (
        <ul className="divide-y border-b">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center gap-3 py-3">
              <FileText
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{document.name}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {getActivity(document.actionId)?.shortLabel} ·{" "}
                  {document.addedAt}
                </p>
              </div>
              <span className="text-muted-foreground text-xs">Dummy</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground border-b py-8 text-sm">
          Belum ada dokumen yang tersedia.
        </p>
      )}
    </section>
  );
}

function ApplicationFacts({ application }: { application: Application }) {
  const facts = [
    ["ID pelanggan", application.customerId],
    ["Jenis permohonan", application.requestType],
    ["Jenis sambungan", application.connectionType],
    ["Unit / ULP", application.unit],
    ["Lokasi", application.location],
    ["Daya", application.power],
    ["Tanggal permohonan", formatDate(application.requestedAt)],
  ];
  return (
    <section aria-labelledby="facts-title">
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
    <section aria-labelledby="decision-title">
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
          label="Persetujuan NPS"
          value={
            application.rejected
              ? "Ditolak"
              : application.decisions.npsApproved === true
                ? "Disetujui"
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
}: {
  history: ReturnType<typeof getHistory>;
}) {
  return (
    <section aria-labelledby="history-title">
      <h2
        id="history-title"
        className="font-display border-b pb-3 text-base font-semibold"
      >
        Activity history
      </h2>
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
            <p className="text-muted-foreground mt-0.5 text-xs">
              oleh {item.by}
            </p>
          </li>
        ))}
      </ol>
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
      ? "text-red-700"
      : tone === "due"
        ? "text-amber-700"
        : tone === "done"
          ? "text-emerald-700"
          : "";
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={`mt-1 max-w-44 text-sm font-medium ${color}`}>{value}</dd>
    </div>
  );
}

function MiniFact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`mt-1 truncate ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
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
      <dd className={`font-medium ${danger ? "text-red-700" : ""}`}>{value}</dd>
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
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}
function displayHistoryDate(value: string) {
  if (!value.includes("T")) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}
